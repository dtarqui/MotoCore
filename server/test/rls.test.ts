import type { SupabaseClient } from '@supabase/supabase-js';
import { beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { type Account, clientAs, hasEnv, registerAccount, request, unique } from './support/scenario.js';

/**
 * NIVEL N4 — VÍA 2 DEL AISLAMIENTO: ACCESO DIRECTO AL MOTOR, CONDICIÓN C3
 * (Plan de pruebas, §6.3). Cubre CP-702, CP-N101, CP-402.2, CP-N106 y CP-704.2.
 *
 * Se PRESCINDE de la interfaz. Con la identidad de la Cuenta B se consultan
 * directamente las tablas de la organización de A. Si una política faltara o
 * estuviera mal escrita, estas consultas devolverían filas — y ninguna
 * verificación de la aplicación estaría ahí para impedirlo. Una tabla sin
 * política activa es una fuga, y solo esta vía la detecta.
 *
 * Lo que se espera de una política correcta: la consulta **no falla**,
 * devuelve CERO filas. La política filtra, no rechaza.
 *
 * Nunca se usa aquí la clave secreta: salta las políticas y la prueba pasaría
 * siempre sin demostrar nada. La interfaz solo interviene para montar el
 * escenario.
 */
describe.skipIf(!hasEnv)('N4 — aislamiento por acceso directo al motor (condición C3)', () => {
  const app = createApp();

  let A: Account;
  let B: Account;
  let mechanic: Account;
  let clientId = '';
  let partId = '';
  /** Cliente de datos con la identidad de B — el intruso. */
  let asB: SupabaseClient;

  /** Las siete tablas de negocio del censo (Modelo de datos) y la organización misma. */
  const TABLES = [
    'mt_workshops',
    'mt_memberships',
    'mt_workshop_assignments',
    'mt_clients',
    'mt_parts',
    'mt_part_movements',
    'mt_audit_log',
  ] as const;

  beforeAll(async () => {
    A = await registerAccount(app, 'rls_a', `Organizacion A ${unique()}`);
    B = await registerAccount(app, 'rls_b', `Organizacion B ${unique()}`);
    mechanic = await registerAccount(app, 'rls_m', `Propia del mecanico ${unique()}`);

    const ctxA = { token: A.token, org: A.orgId, workshop: A.workshopId };

    // A deja datos en todas las tablas del censo.
    const invited = await request(app, '/api/members/invite', {
      ...ctxA,
      method: 'POST',
      body: { email: mechanic.email, role: 'mechanic' },
    });
    expect(invited.status).toBe(201);
    expect(
      (
        await request(app, `/api/workshops/${A.workshopId}/assignments`, {
          ...ctxA,
          method: 'POST',
          body: { user_id: mechanic.userId },
        })
      ).status,
    ).toBe(201);

    const client = await request<{ client: { id: string } }>(app, '/api/clients', {
      ...ctxA,
      method: 'POST',
      body: { first_name: 'Cliente', last_name: 'Reservado' },
    });
    clientId = client.body.client.id;

    const part = await request<{ part: { id: string } }>(app, '/api/inventory/parts', {
      ...ctxA,
      method: 'POST',
      body: { part_number: `P-${unique()}`, name: 'Filtro reservado', initial_stock: 10 },
    });
    partId = part.body.part.id;

    // La desactivación del cliente deja una entrada de auditoría.
    await request(app, `/api/clients/${clientId}/deactivate`, { ...ctxA, method: 'POST' });

    asB = clientAs(B.token);
  });

  it('control del montaje — A ve sus propias filas en las siete tablas del censo', async () => {
    const asA = clientAs(A.token);
    for (const table of TABLES) {
      const { data, error } = await asA.from(table).select('id').eq('organization_id', A.orgId);
      expect(error, table).toBeNull();
      expect((data ?? []).length, table).toBeGreaterThan(0);
    }
  });

  it.each(TABLES)('CP-702 y CP-N101 · %s — B no obtiene ninguna fila de A, sin error', async (table) => {
    const { data, error } = await asB.from(table).select('*').eq('organization_id', A.orgId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('CP-702 · mt_organizations — B no lee la organización de A', async () => {
    const { data, error } = await asB.from('mt_organizations').select('id, name').eq('id', A.orgId);
    expect(error).toBeNull();
    expect(data).toEqual([]);
  });

  it('CP-702 — sin filtro, B tampoco obtiene filas de A: el aislamiento no depende de la consulta', async () => {
    for (const table of TABLES) {
      const { data } = await asB.from(table).select('organization_id');
      expect(
        (data ?? []).filter((row) => (row as { organization_id: string }).organization_id === A.orgId),
        table,
      ).toEqual([]);
    }
  });

  it('CP-N101 — B no ESCRIBE en la organización de A', async () => {
    const insert = await asB
      .from('mt_clients')
      .insert({ organization_id: A.orgId, first_name: 'In', last_name: 'truso' })
      .select();
    expect(insert.error).not.toBeNull();

    const update = await asB.from('mt_clients').update({ first_name: 'Alterado' }).eq('id', clientId).select();
    expect(update.data ?? []).toEqual([]);

    const workshop = await asB.from('mt_workshops').update({ name: 'Tomado' }).eq('id', A.workshopId).select();
    expect(workshop.data ?? []).toEqual([]);

    const membership = await asB
      .from('mt_memberships')
      .insert({ organization_id: A.orgId, user_id: B.userId, role: 'mechanic' })
      .select();
    expect(membership.error).not.toBeNull();

    // Nada cambió: A sigue viendo su cliente intacto y sin intrusos.
    const { data } = await clientAs(A.token).from('mt_clients').select('first_name').eq('organization_id', A.orgId);
    expect(data).toEqual([{ first_name: 'Cliente' }]);
  });

  it('RN-11 y RN-15 — el historial inmutable no se escribe ni se borra por acceso directo, ni siquiera el propio', async () => {
    const asA = clientAs(A.token);

    const movement = await asA
      .from('mt_part_movements')
      .insert({
        organization_id: A.orgId,
        workshop_id: A.workshopId,
        part_id: partId,
        movement_type: 'compra',
        quantity: 100,
        previous_stock: 10,
        new_stock: 110,
      })
      .select();
    expect(movement.error).not.toBeNull();

    const audit = await asA
      .from('mt_audit_log')
      .insert({ organization_id: A.orgId, performed_by: B.userId, action: 'member.removed', entity: 'membership' })
      .select();
    expect(audit.error).not.toBeNull();

    const erase = await asA.from('mt_part_movements').delete().eq('part_id', partId).select();
    expect(erase.data ?? []).toEqual([]);
    const eraseAudit = await asA.from('mt_audit_log').delete().eq('organization_id', A.orgId).select();
    expect(eraseAudit.data ?? []).toEqual([]);

    const { data } = await asA.from('mt_part_movements').select('id').eq('part_id', partId);
    expect(data).toHaveLength(1);
  });

  it('RN-11 — la existencia no se modifica por acceso directo, sin un movimiento que la explique', async () => {
    const asA = clientAs(A.token);
    const forced = await asA.from('mt_parts').update({ current_stock: 999 }).eq('id', partId).select();
    expect(forced.error).not.toBeNull();

    const born = await asA
      .from('mt_parts')
      .insert({
        organization_id: A.orgId,
        workshop_id: A.workshopId,
        part_number: `S-${unique()}`,
        name: 'Sin movimiento',
        current_stock: 50,
      })
      .select();
    expect(born.error).not.toBeNull();

    const { data } = await asA.from('mt_parts').select('current_stock').eq('id', partId).single();
    expect(data).toEqual({ current_stock: 10 });
  });

  it('CP-402.2 — el motor rechaza un segundo propietario activo en la misma organización', async () => {
    // A es owner, de modo que la política le permite insertar membresías: lo que
    // lo impide es el índice único parcial, no la capa de aplicación.
    const second = await clientAs(A.token)
      .from('mt_memberships')
      .insert({ organization_id: A.orgId, user_id: B.userId, role: 'owner' })
      .select();
    expect(second.error).not.toBeNull();
    expect(second.error!.code).toBe('23505');
  });

  it('Modelo de datos — el motor rechaza asignar a un taller la membresía de otra organización', async () => {
    const { data: foreign } = await clientAs(B.token)
      .from('mt_memberships')
      .select('id')
      .eq('organization_id', B.orgId)
      .eq('user_id', B.userId)
      .single();

    // B es owner de su organización, pero declara la de A en la fila.
    const crossed = await clientAs(A.token)
      .from('mt_workshop_assignments')
      .insert({ organization_id: A.orgId, workshop_id: A.workshopId, membership_id: (foreign as { id: string }).id })
      .select();
    expect(crossed.error).not.toBeNull();
  });

  it('CP-N106 — la búsqueda de cuentas por correo no es invocable por una cuenta autenticada', async () => {
    const { data, error } = await asB.rpc('mt_get_user_id_by_email', { p_email: A.email });
    expect(error).not.toBeNull();
    expect(data).toBeNull();
  });

  it('ADR-007 — las funciones atómicas tampoco son invocables por una cuenta autenticada', async () => {
    const movement = await clientAs(A.token).rpc('mt_register_part_movement', {
      p_part_id: partId,
      p_movement_type: 'compra',
      p_quantity: 1,
    });
    expect(movement.error).not.toBeNull();

    const organization = await asB.rpc('mt_create_organization', {
      p_owner_id: B.userId,
      p_name: 'Por la puerta de atrás',
    });
    expect(organization.error).not.toBeNull();
  });

  it('control negativo — B sigue viendo con normalidad sus propios datos', async () => {
    const { data } = await asB.from('mt_workshops').select('id').eq('organization_id', B.orgId);
    expect(data).toEqual([{ id: B.workshopId }]);
  });

  describe('auditoría reservada al Owner (RF-704)', () => {
    it('el Owner lee el registro de su organización por acceso directo', async () => {
      const { data, error } = await clientAs(A.token)
        .from('mt_audit_log')
        .select('action')
        .eq('organization_id', A.orgId);
      expect(error).toBeNull();
      expect((data ?? []).map((r) => (r as { action: string }).action)).toEqual(
        expect.arrayContaining(['member.invited', 'client.deactivated']),
      );
    });

    it('CP-704.2 — un miembro no propietario no lee el registro por acceso directo', async () => {
      const asMechanic = clientAs(mechanic.token);
      const { data, error } = await asMechanic.from('mt_audit_log').select('id').eq('organization_id', A.orgId);
      expect(error).toBeNull();
      expect(data).toEqual([]);

      // Control: el mismo mecánico sí lee las demás tablas de la organización.
      const clients = await asMechanic.from('mt_clients').select('id').eq('organization_id', A.orgId);
      expect(clients.data).toEqual([{ id: clientId }]);
    });
  });
});
