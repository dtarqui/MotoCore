import { beforeAll, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { internal } from '../src/lib/errors.js';
import {
  type Account,
  clientAs,
  codeOf,
  createBareAccount,
  deleteAccount,
  expectStatus,
  hasEnv,
  PASSWORD,
  registerAccount,
  request,
  signIn,
  unique,
} from './support/scenario.js';

/**
 * NIVEL N3 — INTEGRACIÓN, y VÍA 1 DEL AISLAMIENTO BAJO C1 (Plan de pruebas, §6.2).
 *
 * La arquitectura completa —políticas activas y verificación de membresía
 * activa— contra un proyecto Supabase real con las migraciones aplicadas. Cada
 * caso lleva el identificador CP-nnn de la matriz de trazabilidad.
 *
 * Escenario base (§3.2):
 *   · Cuenta A — Organización 1 (talleres 1.1 y 1.2) y Organización 2.
 *   · Cuenta B — Organización 3 (taller 3.1).
 *   · Cuenta C — sin membresía en ninguna de las anteriores.
 *   · M y R — mecánico y recepcionista invitados a la Organización 1.
 */
describe.skipIf(!hasEnv)('N3 — integración con Supabase real (condición C1)', () => {
  const app = createApp();

  let A: Account;
  let B: Account;
  let C: Account;
  let M: Account;
  let R: Account;
  let org1 = '';
  let org2 = '';
  let ws11 = '';
  let ws12 = '';

  const as = (account: Account, org?: string, workshop?: string) => ({ token: account.token, org, workshop });

  async function invite(orgId: string, email: string, role: 'mechanic' | 'receptionist') {
    return request<{ member: { user_id: string; role: string; is_active: boolean } }>(app, '/api/members/invite', {
      ...as(A, orgId),
      method: 'POST',
      body: { email, role },
    });
  }

  async function createPart(account: Account, workshopId: string, body: Record<string, unknown>) {
    const reply = await request<{ part: { id: string; current_stock: number; workshop_id: string } }>(
      app,
      '/api/inventory/parts',
      { ...as(account, org1, workshopId), method: 'POST', body },
    );
    return reply;
  }

  beforeAll(async () => {
    A = await registerAccount(app, 'a', `Organizacion 1 ${unique()}`, 'Taller 1.1');
    org1 = A.orgId;
    ws11 = A.workshopId;

    const ws = await request<{ workshop: { id: string } }>(app, '/api/workshops', {
      ...as(A, org1),
      method: 'POST',
      body: { name: 'Taller 1.2' },
    });
    expect(ws.status).toBe(201);
    ws12 = ws.body.workshop.id;

    const second = await request<{ organization: { id: string } }>(app, '/api/organizations', {
      token: A.token,
      method: 'POST',
      body: { name: `Organizacion 2 ${unique()}` },
    });
    expect(second.status).toBe(201);
    org2 = second.body.organization.id;

    B = await registerAccount(app, 'b', `Organizacion 3 ${unique()}`, 'Taller 3.1');
    C = await registerAccount(app, 'c', `Organizacion C ${unique()}`);
    M = await registerAccount(app, 'm', `Propia de M ${unique()}`);
    R = await registerAccount(app, 'r', `Propia de R ${unique()}`);

    expect((await invite(org1, M.email, 'mechanic')).status).toBe(201);
    expect((await invite(org1, R.email, 'receptionist')).status).toBe(201);
  });

  // ==========================================================================
  // 5.1 Identidad y cuentas
  // ==========================================================================
  describe('identidad y cuentas', () => {
    it('CP-101.1 — el registro crea organización, taller y membresía owner', async () => {
      const me = await request<{ organizations: Array<{ role: string; organization: { id: string } }> }>(
        app,
        '/api/auth/me',
        { token: B.token },
      );
      expect(me.status).toBe(200);
      expect(me.body.organizations).toEqual([
        { role: 'owner', organization: expect.objectContaining({ id: B.orgId }) },
      ]);

      const workshops = await request<{ workshops: Array<{ id: string; name: string }> }>(
        app,
        '/api/workshops',
        as(B, B.orgId),
      );
      expect(workshops.body.workshops).toEqual([expect.objectContaining({ id: B.workshopId, name: 'Taller 3.1' })]);
    });

    it('CP-101.2 — un correo ya registrado se rechaza y no crea organización alguna', async () => {
      const reply = await request(app, '/api/auth/register', {
        method: 'POST',
        body: {
          email: B.email,
          password: PASSWORD,
          first_name: 'Otra',
          last_name: 'Vez',
          organization_name: 'Duplicada',
        },
      });
      expectStatus(reply, 409, 'auth.email_already_registered');

      const organizations = await request<{ organizations: unknown[] }>(app, '/api/organizations', { token: B.token });
      expect(organizations.body.organizations).toHaveLength(1);
    });

    it('CP-101.3 — si falla la creación de la organización, no queda cuenta ni registro huérfano', async () => {
      const failing = createApp({
        organizationFactory: {
          create: async () => {
            throw internal('mt_create_organization: fallo simulado por la prueba');
          },
        },
      });
      const email = `huerfano_${unique()}@motocore.test`;
      const body = { email, password: PASSWORD, first_name: 'Sin', last_name: 'Rastro', organization_name: 'Nunca' };

      expectStatus(
        await request(failing, '/api/auth/register', { method: 'POST', body }),
        500,
        'auth.registration_failed',
      );
      // La cuenta se revirtió: no se puede iniciar sesión y el correo sigue libre.
      await expect(signIn(email)).rejects.toBeTruthy();
      expect((await request(app, '/api/auth/register', { method: 'POST', body })).status).toBe(201);
    });

    it('CP-102 — la credencial emitida por el proveedor es aceptada por la interfaz', async () => {
      const token = await signIn(C.email);
      const me = await request<{ email: string; user_id: string }>(app, '/api/auth/me', { token });
      expect(me.status).toBe(200);
      expect(me.body).toMatchObject({ email: C.email, user_id: C.userId });
    });
  });

  // ==========================================================================
  // 5.2 Organizaciones y talleres
  // ==========================================================================
  describe('organizaciones', () => {
    it('CP-201 — la segunda organización aparece en el listado con rol owner', async () => {
      const reply = await request<{ organizations: Array<{ role: string; organization: { id: string } }> }>(
        app,
        '/api/organizations',
        { token: A.token },
      );
      expect(reply.body.organizations.map((o) => [o.organization.id, o.role]).sort()).toEqual(
        [
          [org1, 'owner'],
          [org2, 'owner'],
        ].sort(),
      );
    });

    it('CP-203.1 — el cambio devuelve organización y rol, y lo siguiente opera sobre ella', async () => {
      const switched = await request<{ role: string; organization: { id: string } }>(
        app,
        `/api/organizations/${org2}/switch`,
        {
          token: A.token,
          method: 'POST',
        },
      );
      expect(switched.status).toBe(200);
      expect(switched.body).toMatchObject({ role: 'owner', organization: { id: org2 } });

      const workshops = await request<{ workshops: unknown[] }>(app, '/api/workshops', as(A, org2));
      expect(workshops.body.workshops).toEqual([]);
    });

    it('CP-203.2 — activar una organización sin membresía responde 403 organization.access_denied', async () => {
      expectStatus(
        await request(app, `/api/organizations/${org1}/switch`, { token: C.token, method: 'POST' }),
        403,
        'organization.access_denied',
      );
    });

    it('CP-204 — el Owner edita la organización; un no-Owner recibe 403', async () => {
      const phone = `4${Date.now().toString().slice(-7)}`;
      const edited = await request<{ organization: { phone: string } }>(app, `/api/organizations/${org1}`, {
        token: A.token,
        method: 'PATCH',
        body: { phone },
      });
      expect(edited.status).toBe(200);
      expect(edited.body.organization.phone).toBe(phone);

      expectStatus(
        await request(app, `/api/organizations/${org1}`, { token: M.token, method: 'PATCH', body: { phone: '1' } }),
        403,
        'organization.insufficient_permissions',
      );
      const detail = await request<{ organization: { phone: string } }>(app, `/api/organizations/${org1}`, {
        token: M.token,
      });
      expect(detail.body.organization.phone).toBe(phone);
    });
  });

  describe('talleres', () => {
    it('CP-301.1 y CP-302 — el listado muestra los talleres de la organización activa y solo esos', async () => {
      const own = await request<{ workshops: Array<{ id: string }> }>(app, '/api/workshops', as(M, org1));
      expect(own.body.workshops.map((w) => w.id).sort()).toEqual([ws11, ws12].sort());

      const other = await request<{ workshops: Array<{ id: string }> }>(app, '/api/workshops', as(B, B.orgId));
      expect(other.body.workshops.map((w) => w.id)).not.toContain(ws11);
    });

    it('CP-301.2 — un no-Owner que intenta crear recibe 403', async () => {
      for (const account of [M, R]) {
        expectStatus(
          await request(app, '/api/workshops', {
            ...as(account, org1),
            method: 'POST',
            body: { name: `X ${unique()}` },
          }),
          403,
          'workshop.insufficient_permissions',
        );
      }
    });

    it('CP-301.3 — la edición se refleja en la ficha; un no-Owner que intenta editar recibe 403', async () => {
      const address = `Av. Heroínas ${unique()}`;
      expect(
        (await request(app, `/api/workshops/${ws12}`, { ...as(A, org1), method: 'PATCH', body: { address } })).status,
      ).toBe(200);
      const detail = await request<{ workshop: { address: string } }>(app, `/api/workshops/${ws12}`, as(M, org1));
      expect(detail.body.workshop.address).toBe(address);

      expectStatus(
        await request(app, `/api/workshops/${ws12}`, { ...as(M, org1), method: 'PATCH', body: { address: 'X' } }),
        403,
        'workshop.insufficient_permissions',
      );
    });

    it('RN-06 — no admite dos talleres con el mismo nombre en la organización', async () => {
      expectStatus(
        await request(app, '/api/workshops', { ...as(A, org1), method: 'POST', body: { name: 'Taller 1.2' } }),
        409,
        'workshop.duplicate_name',
      );
      // En otra organización, el mismo nombre se acepta.
      expect(
        (await request(app, '/api/workshops', { ...as(A, org2), method: 'POST', body: { name: 'Taller 1.2' } })).status,
      ).toBe(201);
    });

    it('CP-303.2 — un taller de otra organización en la cabecera responde 404 workshop.not_found', async () => {
      expectStatus(await request(app, '/api/inventory/parts', as(A, org1, B.workshopId)), 404, 'workshop.not_found');
    });

    it('CP-305 — el taller desactivado deja de listarse como activo y sus datos siguen consultables', async () => {
      const created = await request<{ workshop: { id: string } }>(app, '/api/workshops', {
        ...as(A, org1),
        method: 'POST',
        body: { name: `Temporal ${unique()}` },
      });
      const id = created.body.workshop.id;

      const deactivated = await request<{ workshop: { is_active: boolean } }>(app, `/api/workshops/${id}/deactivate`, {
        ...as(A, org1),
        method: 'POST',
      });
      expect(deactivated.body.workshop.is_active).toBe(false);

      const active = await request<{ workshops: Array<{ id: string }> }>(app, '/api/workshops', as(M, org1));
      expect(active.body.workshops.map((w) => w.id)).not.toContain(id);
      const all = await request<{ workshops: Array<{ id: string }> }>(
        app,
        '/api/workshops?includeInactive=true',
        as(M, org1),
      );
      expect(all.body.workshops.map((w) => w.id)).toContain(id);
      expect((await request(app, `/api/workshops/${id}`, as(M, org1))).status).toBe(200);
    });

    it('CP-304.1 y CP-304.2 — la asignación se registra y se retira sin afectar la membresía ni lo que el miembro ve', async () => {
      const before = await request<{ clients: unknown[] }>(app, '/api/clients', as(M, org1));

      const assigned = await request<{ assignment: { user_id: string } }>(app, `/api/workshops/${ws12}/assignments`, {
        ...as(A, org1),
        method: 'POST',
        body: { user_id: M.userId },
      });
      expect(assigned.status).toBe(201);
      expect(assigned.body.assignment.user_id).toBe(M.userId);

      const again = await request(app, `/api/workshops/${ws12}/assignments`, {
        ...as(A, org1),
        method: 'POST',
        body: { user_id: M.userId },
      });
      expect(again.status).toBe(200);

      const listed = await request<{ assignments: Array<{ user_id: string }> }>(
        app,
        `/api/workshops/${ws12}/assignments`,
        as(M, org1),
      );
      expect(listed.body.assignments.map((a) => a.user_id)).toEqual([M.userId]);

      const after = await request<{ clients: unknown[] }>(app, '/api/clients', as(M, org1));
      expect(after.body.clients).toEqual(before.body.clients);

      expect(
        (await request(app, `/api/workshops/${ws12}/assignments/${M.userId}`, { ...as(A, org1), method: 'DELETE' }))
          .status,
      ).toBe(204);
      const members = await request<{ members: Array<{ user_id: string; is_active: boolean }> }>(
        app,
        '/api/members',
        as(A, org1),
      );
      expect(members.body.members).toContainEqual(expect.objectContaining({ user_id: M.userId, is_active: true }));
    });
  });

  // ==========================================================================
  // 5.3 Miembros y control de acceso
  // ==========================================================================
  describe('miembros', () => {
    it('CP-401.1, CP-403, CP-404, CP-401.3, CP-202 y CP-104 — ciclo de vida de una membresía', async () => {
      const X = await registerAccount(app, 'x', `Propia de X ${unique()}`);

      expectStatus(await request(app, '/api/clients', as(X, org1)), 403, 'organization.access_denied');

      // CP-401.1: tras la invitación, accede.
      expect((await invite(org1, X.email, 'mechanic')).status).toBe(201);
      expect((await request(app, '/api/clients', as(X, org1))).status).toBe(200);

      // CP-202: ve la organización aunque no la haya creado.
      const orgs = await request<{ organizations: Array<{ organization: { id: string } }> }>(
        app,
        '/api/organizations',
        { token: X.token },
      );
      expect(orgs.body.organizations.map((o) => o.organization.id)).toContain(org1);

      // CP-403: el nuevo rol surte efecto en la petición siguiente.
      expectStatus(
        await request(app, '/api/clients', {
          ...as(X, org1),
          method: 'POST',
          body: { first_name: 'A', last_name: 'B' },
        }),
        403,
        'client.insufficient_permissions',
      );
      const changed = await request<{ member: { role: string } }>(app, `/api/members/${X.userId}/role`, {
        ...as(A, org1),
        method: 'PATCH',
        body: { role: 'receptionist' },
      });
      expect(changed.body.member.role).toBe('receptionist');
      expect(
        (
          await request(app, '/api/clients', {
            ...as(X, org1),
            method: 'POST',
            body: { first_name: 'Por', last_name: `X ${unique()}` },
          })
        ).status,
      ).toBe(201);

      // CP-104 y CP-202: una membresía revocada deja de listarse.
      expect((await invite(org2, X.email, 'mechanic')).status).toBe(201);
      expect((await request(app, `/api/members/${X.userId}`, { ...as(A, org2), method: 'DELETE' })).status).toBe(204);
      const me = await request<{ organizations: Array<{ role: string; organization: { id: string } }> }>(
        app,
        '/api/auth/me',
        {
          token: X.token,
        },
      );
      expect(me.body.organizations.map((o) => [o.organization.id, o.role]).sort()).toEqual(
        [
          [X.orgId, 'owner'],
          [org1, 'receptionist'],
        ].sort(),
      );

      // CP-404: el removido pierde el acceso de inmediato.
      expect((await request(app, `/api/members/${X.userId}`, { ...as(A, org1), method: 'DELETE' })).status).toBe(204);
      expectStatus(await request(app, '/api/clients', as(X, org1)), 403, 'organization.access_denied');

      // CP-401.3: reincorporarlo reactiva la membresía con el nuevo rol, sin duplicarla.
      const back = await invite(org1, X.email, 'mechanic');
      expect(back.body.member).toMatchObject({ user_id: X.userId, role: 'mechanic', is_active: true });
      const members = await request<{ members: Array<{ user_id: string }> }>(
        app,
        '/api/members?includeInactive=true',
        as(A, org1),
      );
      expect(members.body.members.filter((m) => m.user_id === X.userId)).toHaveLength(1);
    });

    it('CP-401.2 — un correo sin cuenta responde 404 member.not_found', async () => {
      expectStatus(await invite(org1, `nadie_${unique()}@motocore.test`, 'mechanic'), 404, 'member.not_found');
    });

    it('HU-09 — invitar a quien ya es miembro activo responde 409 member.already_active', async () => {
      expectStatus(await invite(org1, M.email, 'receptionist'), 409, 'member.already_active');
    });

    it('CP-405 — cambiar el rol del propietario o removerlo responde 403 member.owner_protected', async () => {
      expectStatus(
        await request(app, `/api/members/${A.userId}/role`, {
          ...as(A, org1),
          method: 'PATCH',
          body: { role: 'mechanic' },
        }),
        403,
        'member.owner_protected',
      );
      expectStatus(
        await request(app, `/api/members/${A.userId}`, { ...as(A, org1), method: 'DELETE' }),
        403,
        'member.owner_protected',
      );
    });

    it('CP-402.1 — no se invita ni se promueve a owner', async () => {
      expectStatus(
        await request(app, '/api/members/invite', {
          ...as(A, org1),
          method: 'POST',
          body: { email: C.email, role: 'owner' },
        }),
        403,
        'member.owner_role_forbidden',
      );
      expectStatus(
        await request(app, `/api/members/${M.userId}/role`, {
          ...as(A, org1),
          method: 'PATCH',
          body: { role: 'owner' },
        }),
        403,
        'member.owner_role_forbidden',
      );
    });

    it('CP-406 — un Mechanic o un Receptionist que intenta invitar recibe 403', async () => {
      for (const account of [M, R]) {
        expectStatus(
          await request(app, '/api/members/invite', {
            ...as(account, org1),
            method: 'POST',
            body: { email: C.email, role: 'mechanic' },
          }),
          403,
          'member.insufficient_permissions',
        );
      }
    });

    it('CP-407 — cualquier miembro consulta el equipo de la organización activa, con rol y estado', async () => {
      const reply = await request<{
        members: Array<{ user_id: string; role: string; is_active: boolean; email: string }>;
      }>(app, '/api/members', as(M, org1));
      expect(reply.status).toBe(200);
      expect(reply.body.members).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ user_id: A.userId, role: 'owner', is_active: true, email: A.email }),
          expect.objectContaining({ user_id: M.userId, role: 'mechanic', is_active: true }),
          expect.objectContaining({ user_id: R.userId, role: 'receptionist', is_active: true }),
        ]),
      );
      expect(reply.body.members.map((m) => m.user_id)).not.toContain(B.userId);
    });
  });

  // ==========================================================================
  // 5.4 Clientes — nivel organización
  // ==========================================================================
  describe('clientes — nivel organización', () => {
    const newClient = (account: Account, orgId: string, body: Record<string, unknown>, workshop?: string) =>
      request<{ client: { id: string; is_active: boolean } }>(app, '/api/clients', {
        ...as(account, orgId, workshop),
        method: 'POST',
        body,
      });

    it('CP-501 — el cliente creado se recupera por identificador', async () => {
      const created = await newClient(R, org1, {
        first_name: 'Ana',
        last_name: `Quispe ${unique()}`,
        phone: '70011223',
      });
      expect(created.status).toBe(201);
      const detail = await request<{ client: { phone: string; organization_id: string } }>(
        app,
        `/api/clients/${created.body.client.id}`,
        as(M, org1),
      );
      expect(detail.body.client).toMatchObject({ phone: '70011223', organization_id: org1 });
    });

    it('CP-502 — un cliente creado con el taller A activo se lista con el taller B activo', async () => {
      const created = await newClient(R, org1, { first_name: 'Luis', last_name: `Mamani ${unique()}` }, ws11);
      const listed = await request<{ clients: Array<{ id: string }> }>(app, '/api/clients', as(R, org1, ws12));
      expect(listed.body.clients.map((c) => c.id)).toContain(created.body.client.id);
    });

    it('CP-503.1 y CP-503.2 — el correo es único por organización, no entre organizaciones', async () => {
      const email = `cliente_${unique()}@correo.bo`;
      expect((await newClient(R, org1, { first_name: 'Uno', last_name: 'Uno', email })).status).toBe(201);
      expectStatus(
        await newClient(A, org1, { first_name: 'Dos', last_name: 'Dos', email: email.toUpperCase() }),
        409,
        'client.duplicate_email',
      );
      expect((await newClient(B, B.orgId, { first_name: 'Tres', last_name: 'Tres', email })).status).toBe(201);
    });

    it('CP-504.1 y CP-504.2 — la baja conserva el registro, y la búsqueda no sale de la organización', async () => {
      const surname = `Buscable${unique()}`;
      const mine = await newClient(R, org1, { first_name: 'Carla', last_name: surname });
      await newClient(B, B.orgId, { first_name: 'Carla', last_name: surname });

      const found = await request<{ clients: Array<{ id: string; organization_id: string }> }>(
        app,
        `/api/clients?search=${encodeURIComponent(surname.toLowerCase())}`,
        as(R, org1),
      );
      expect(found.body.clients.map((c) => c.id)).toEqual([mine.body.client.id]);

      const deactivated = await request<{ client: { is_active: boolean } }>(
        app,
        `/api/clients/${mine.body.client.id}/deactivate`,
        {
          ...as(R, org1),
          method: 'POST',
        },
      );
      expect(deactivated.body.client.is_active).toBe(false);

      const active = await request<{ clients: unknown[] }>(app, `/api/clients?search=${surname}`, as(R, org1));
      expect(active.body.clients).toEqual([]);
      const all = await request<{ clients: unknown[] }>(
        app,
        `/api/clients?search=${surname}&includeInactive=true`,
        as(R, org1),
      );
      expect(all.body.clients).toHaveLength(1);
    });

    it('la búsqueda con caracteres de la sintaxis de filtros se busca literalmente', async () => {
      const reply = await request<{ clients: unknown[] }>(
        app,
        `/api/clients?search=${encodeURIComponent('a,organization_id.neq.x),(b')}`,
        as(R, org1),
      );
      expect(reply.status).toBe(200);
      expect(reply.body.clients).toEqual([]);
    });

    it('CP-505 — un Mechanic que intenta crear recibe 403; consultar sí puede', async () => {
      expectStatus(
        await newClient(M, org1, { first_name: 'No', last_name: 'Puede' }),
        403,
        'client.insufficient_permissions',
      );
      expect((await request(app, '/api/clients', as(M, org1))).status).toBe(200);
    });
  });

  // ==========================================================================
  // 5.5 Inventario — nivel taller
  // ==========================================================================
  describe('inventario — nivel taller', () => {
    const stockOf = async (partId: string, workshopId: string) =>
      (
        await request<{ part: { current_stock: number } }>(
          app,
          `/api/inventory/parts/${partId}`,
          as(A, org1, workshopId),
        )
      ).body.part.current_stock;

    const move = (partId: string, workshopId: string, body: Record<string, unknown>, account: Account = A) =>
      request<{ movement: { movement_type: string; previous_stock: number; new_stock: number } }>(
        app,
        `/api/inventory/parts/${partId}/movements`,
        { ...as(account, org1, workshopId), method: 'POST', body },
      );

    it('CP-601, CP-602, CP-603.1 y CP-603.2 — el repuesto es del taller activo y el número se repite entre talleres', async () => {
      const number = `F-${unique()}`;
      const created = await createPart(R, ws11, { part_number: number, name: 'Filtro de aceite' });
      expect(created.status).toBe(201);
      expect(created.body.part.workshop_id).toBe(ws11);

      const otherList = await request<{ parts: Array<{ id: string }> }>(app, '/api/inventory/parts', as(R, org1, ws12));
      expect(otherList.body.parts.map((p) => p.id)).not.toContain(created.body.part.id);
      expectStatus(
        await request(app, `/api/inventory/parts/${created.body.part.id}`, as(R, org1, ws12)),
        404,
        'inventory.part_not_found',
      );

      expectStatus(
        await createPart(R, ws11, { part_number: number, name: 'Repetido' }),
        409,
        'inventory.duplicate_part_number',
      );
      expect((await createPart(R, ws12, { part_number: number, name: 'Mismo número' })).status).toBe(201);
    });

    it('HU-16 y RN-12 — la existencia inicial genera su movimiento de entrada', async () => {
      const created = await createPart(R, ws11, {
        part_number: `I-${unique()}`,
        name: 'Bujía',
        initial_stock: 5,
        unit_cost: 12.5,
      });
      expect(created.body.part.current_stock).toBe(5);

      const history = await request<{ movements: Array<Record<string, unknown>> }>(
        app,
        `/api/inventory/parts/${created.body.part.id}/movements`,
        as(M, org1, ws11),
      );
      expect(history.body.movements).toEqual([
        expect.objectContaining({
          movement_type: 'compra',
          quantity: 5,
          previous_stock: 0,
          new_stock: 5,
          total_cost: 62.5,
        }),
      ]);
    });

    it('CP-604.1 y CP-605 — cada tipo directo deja existencia anterior y posterior, y recalcula según su regla', async () => {
      const part = (await createPart(A, ws11, { part_number: `M-${unique()}`, name: 'Cadena' })).body.part;
      const steps: Array<[string, number, number, number]> = [
        ['compra', 10, 0, 10],
        ['venta', 3, 10, 7],
        ['devolucion', 2, 7, 9],
        ['merma', 4, 9, 5],
        ['ajuste', 12, 5, 12],
      ];
      for (const [movement_type, quantity, previous, next] of steps) {
        const reply = await move(part.id, ws11, { movement_type, quantity });
        expect(reply.status, movement_type).toBe(201);
        expect(reply.body.movement).toMatchObject({ movement_type, previous_stock: previous, new_stock: next });
      }
      expect(await stockOf(part.id, ws11)).toBe(12);
    });

    it('CP-604.2 — el tipo transferencia enviado directamente se rechaza', async () => {
      const part = (await createPart(A, ws11, { part_number: `T-${unique()}`, name: 'Pastilla', initial_stock: 3 }))
        .body.part;
      expectStatus(
        await move(part.id, ws11, { movement_type: 'transferencia', quantity: 1 }),
        400,
        'inventory.invalid_movement_type',
      );
      expect(await stockOf(part.id, ws11)).toBe(3);
    });

    it('CP-604.3 — los movimientos no admiten modificación ni borrado', async () => {
      const part = (await createPart(A, ws11, { part_number: `H-${unique()}`, name: 'Aceite', initial_stock: 4 })).body
        .part;
      const db = clientAs(A.token);

      const updated = await db.from('mt_part_movements').update({ quantity: 999 }).eq('part_id', part.id).select();
      expect(updated.error ?? updated.data).toBeTruthy();
      expect(updated.data ?? []).toEqual([]);

      const deleted = await db.from('mt_part_movements').delete().eq('part_id', part.id).select();
      expect(deleted.data ?? []).toEqual([]);

      const history = await request<{ movements: Array<{ quantity: number }> }>(
        app,
        `/api/inventory/parts/${part.id}/movements`,
        as(A, org1, ws11),
      );
      expect(history.body.movements).toEqual([expect.objectContaining({ quantity: 4 })]);
    });

    it('CP-606 — el movimiento que dejaría existencia negativa se rechaza y no altera el stock', async () => {
      const part = (await createPart(A, ws11, { part_number: `N-${unique()}`, name: 'Faro', initial_stock: 2 })).body
        .part;
      expectStatus(
        await move(part.id, ws11, { movement_type: 'venta', quantity: 3 }, M),
        409,
        'inventory.insufficient_stock',
      );
      expect(await stockOf(part.id, ws11)).toBe(2);
    });

    it('CP-607 — el listado de bajo stock devuelve solo los que están en o bajo el mínimo', async () => {
      const low = (
        await createPart(A, ws12, { part_number: `L-${unique()}`, name: 'Bajo', initial_stock: 1, minimum_stock: 2 })
      ).body.part;
      const edge = (
        await createPart(A, ws12, { part_number: `E-${unique()}`, name: 'Justo', initial_stock: 2, minimum_stock: 2 })
      ).body.part;
      const fine = (
        await createPart(A, ws12, { part_number: `O-${unique()}`, name: 'Sobra', initial_stock: 9, minimum_stock: 2 })
      ).body.part;

      const reply = await request<{
        parts: Array<{ id: string; current_stock: number; minimum_stock: number; workshop_id: string }>;
      }>(app, '/api/inventory/parts?lowStock=true', as(M, org1, ws12));
      const ids = reply.body.parts.map((p) => p.id);
      expect(ids).toEqual(expect.arrayContaining([low.id, edge.id]));
      expect(ids).not.toContain(fine.id);
      expect(reply.body.parts.every((p) => p.current_stock <= p.minimum_stock && p.workshop_id === ws12)).toBe(true);
    });

    it('CP-608.1 y CP-608.2 — la transferencia mueve existencias de forma consistente y se rechaza entera si falta stock', async () => {
      const number = `X-${unique()}`;
      const origin = (await createPart(A, ws11, { part_number: number, name: 'Llanta', initial_stock: 8 })).body.part;
      const target = (await createPart(A, ws12, { part_number: number, name: 'Llanta', initial_stock: 1 })).body.part;

      const moved = await request<{
        movements: Array<{
          part_id: string;
          movement_type: string;
          transfer_id: string;
          previous_stock: number;
          new_stock: number;
        }>;
      }>(app, `/api/inventory/parts/${origin.id}/transfer`, {
        ...as(A, org1, ws11),
        method: 'POST',
        body: { to_workshop_id: ws12, quantity: 5 },
      });
      expect(moved.status).toBe(201);
      const [out, into] = moved.body.movements;
      expect(out).toMatchObject({
        part_id: origin.id,
        movement_type: 'transferencia',
        previous_stock: 8,
        new_stock: 3,
      });
      expect(into).toMatchObject({
        part_id: target.id,
        movement_type: 'transferencia',
        previous_stock: 1,
        new_stock: 6,
      });
      expect(out!.transfer_id).toBe(into!.transfer_id);

      expectStatus(
        await request(app, `/api/inventory/parts/${origin.id}/transfer`, {
          ...as(A, org1, ws11),
          method: 'POST',
          body: { to_workshop_id: ws12, quantity: 10 },
        }),
        409,
        'inventory.insufficient_stock',
      );
      expect(await stockOf(origin.id, ws11)).toBe(3);
      expect(await stockOf(target.id, ws12)).toBe(6);
    });

    it('CP-608.3 — un destino fuera de la organización responde 403, igual que uno inexistente', async () => {
      const part = (await createPart(A, ws11, { part_number: `Y-${unique()}`, name: 'Espejo', initial_stock: 4 })).body
        .part;
      const transfer = (to: string) =>
        request(app, `/api/inventory/parts/${part.id}/transfer`, {
          ...as(A, org1, ws11),
          method: 'POST',
          body: { to_workshop_id: to, quantity: 1 },
        });

      const foreign = await transfer(B.workshopId);
      expectStatus(foreign, 403, 'inventory.cross_organization_transfer');
      expect((await transfer('00000000-0000-4000-8000-000000000000')).body).toEqual(foreign.body);
      expect(await stockOf(part.id, ws11)).toBe(4);
    });

    it('RF-608 — si el taller de destino no tiene ese número de parte, responde 404', async () => {
      const part = (await createPart(A, ws11, { part_number: `Z-${unique()}`, name: 'Solo aquí', initial_stock: 4 }))
        .body.part;
      expectStatus(
        await request(app, `/api/inventory/parts/${part.id}/transfer`, {
          ...as(A, org1, ws11),
          method: 'POST',
          body: { to_workshop_id: ws12, quantity: 1 },
        }),
        404,
        'inventory.part_not_found',
      );
    });

    it('CP-609 — el Mechanic no administra el catálogo pero registra movimientos; el Receptionist no transfiere', async () => {
      const part = (await createPart(R, ws11, { part_number: `P-${unique()}`, name: 'Freno', initial_stock: 6 })).body
        .part;

      expectStatus(
        await createPart(M, ws11, { part_number: `Q-${unique()}`, name: 'No' }),
        403,
        'inventory.insufficient_permissions',
      );
      expectStatus(
        await request(app, `/api/inventory/parts/${part.id}`, {
          ...as(M, org1, ws11),
          method: 'PATCH',
          body: { name: 'No' },
        }),
        403,
        'inventory.insufficient_permissions',
      );
      expect((await move(part.id, ws11, { movement_type: 'venta', quantity: 1 }, M)).status).toBe(201);

      for (const account of [R, M]) {
        expectStatus(
          await request(app, `/api/inventory/parts/${part.id}/transfer`, {
            ...as(account, org1, ws11),
            method: 'POST',
            body: { to_workshop_id: ws12, quantity: 1 },
          }),
          403,
          'inventory.insufficient_permissions',
        );
      }
    });

    it('RF-601 — el PATCH edita el catálogo y nunca la existencia', async () => {
      const part = (await createPart(R, ws11, { part_number: `K-${unique()}`, name: 'Kit', initial_stock: 7 })).body
        .part;
      const edited = await request<{ part: { name: string; current_stock: number } }>(
        app,
        `/api/inventory/parts/${part.id}`,
        {
          ...as(R, org1, ws11),
          method: 'PATCH',
          body: { name: 'Kit de arrastre', current_stock: 999 },
        },
      );
      expect(edited.body.part).toMatchObject({ name: 'Kit de arrastre', current_stock: 7 });
    });
  });

  // ==========================================================================
  // 5.6 Aislamiento y auditoría
  // ==========================================================================
  describe('aislamiento por la interfaz y auditoría', () => {
    it('CP-N105 — para un mismo identificador, un recurso ajeno y uno inexistente responden idéntico', async () => {
      const foreign = await request<{ client: { id: string } }>(app, '/api/clients', {
        ...as(B, B.orgId),
        method: 'POST',
        body: { first_name: 'Ajeno', last_name: unique() },
      });
      const missing = '00000000-0000-4000-8000-000000000000';

      const pairs: Array<[string, string, string?]> = [
        [`/api/clients/${foreign.body.client.id}`, `/api/clients/${missing}`],
        [`/api/workshops/${B.workshopId}`, `/api/workshops/${missing}`],
      ];
      for (const [ajeno, inexistente] of pairs) {
        const a = await request(app, ajeno, as(A, org1));
        const b = await request(app, inexistente, as(A, org1));
        expect(a.status).toBe(404);
        expect({ status: a.status, body: a.body }).toEqual({ status: b.status, body: b.body });
      }

      const partB = (
        await request<{ part: { id: string } }>(app, '/api/inventory/parts', {
          ...as(B, B.orgId, B.workshopId),
          method: 'POST',
          body: { part_number: `AJ-${unique()}`, name: 'Ajeno' },
        })
      ).body.part;
      const a = await request(app, `/api/inventory/parts/${partB.id}`, as(A, org1, ws11));
      const b = await request(app, `/api/inventory/parts/${missing}`, as(A, org1, ws11));
      expect(a).toEqual(b);
    });

    it('CP-701 — una cuenta sin membresía no obtiene dato alguno en ninguna operación', async () => {
      const client = (
        await request<{ client: { id: string } }>(app, '/api/clients', {
          ...as(A, org1),
          method: 'POST',
          body: { first_name: 'Reservado', last_name: unique() },
        })
      ).body.client;
      const part = (await createPart(A, ws11, { part_number: `R-${unique()}`, name: 'Reservado', initial_stock: 3 }))
        .body.part;

      const operations: Array<[string, string, unknown?, boolean?]> = [
        ['GET', '/api/clients'],
        ['POST', '/api/clients', { first_name: 'In', last_name: 'truso' }],
        ['GET', `/api/clients/${client.id}`],
        ['PATCH', `/api/clients/${client.id}`, { phone: '1' }],
        ['POST', `/api/clients/${client.id}/deactivate`],
        ['GET', '/api/workshops'],
        ['POST', '/api/workshops', { name: 'Intruso' }],
        ['GET', `/api/workshops/${ws11}`],
        ['PATCH', `/api/workshops/${ws11}`, { name: 'Intruso' }],
        ['POST', `/api/workshops/${ws11}/deactivate`],
        ['GET', `/api/workshops/${ws11}/assignments`],
        ['GET', '/api/members'],
        ['POST', '/api/members/invite', { email: C.email, role: 'mechanic' }],
        ['PATCH', `/api/members/${M.userId}/role`, { role: 'receptionist' }],
        ['DELETE', `/api/members/${M.userId}`],
        ['GET', '/api/audit'],
        ['GET', '/api/inventory/parts', undefined, true],
        ['POST', '/api/inventory/parts', { part_number: 'IN', name: 'Intruso' }, true],
        ['GET', `/api/inventory/parts/${part.id}`, undefined, true],
        ['GET', `/api/inventory/parts/${part.id}/movements`, undefined, true],
        ['POST', `/api/inventory/parts/${part.id}/movements`, { movement_type: 'venta', quantity: 1 }, true],
        ['POST', `/api/inventory/parts/${part.id}/transfer`, { to_workshop_id: ws12, quantity: 1 }, true],
      ];

      for (const intruder of [C, B]) {
        for (const [method, path, body, workshopLevel] of operations) {
          const reply = await request(app, path, {
            ...as(intruder, org1, workshopLevel ? ws11 : undefined),
            method,
            body,
          });
          expect({ op: `${method} ${path}`, status: reply.status, code: codeOf(reply) }).toEqual({
            op: `${method} ${path}`,
            status: 403,
            code: 'organization.access_denied',
          });
        }
        for (const [method, path] of [
          ['GET', `/api/organizations/${org1}`],
          ['PATCH', `/api/organizations/${org1}`],
          ['POST', `/api/organizations/${org1}/switch`],
        ] as const) {
          expectStatus(
            await request(app, path, {
              token: intruder.token,
              method,
              body: method === 'PATCH' ? { name: 'X' } : undefined,
            }),
            403,
            'organization.access_denied',
          );
        }
      }

      // Nada cambió en la organización 1.
      expect(await request(app, `/api/clients/${client.id}`, as(A, org1))).toMatchObject({
        status: 200,
        body: { client: { phone: null, is_active: true } },
      });
      expect(
        (await request<{ part: { current_stock: number } }>(app, `/api/inventory/parts/${part.id}`, as(A, org1, ws11)))
          .body.part.current_stock,
      ).toBe(3);
    });

    it('CP-703.1 a CP-703.7 — las seis acciones críticas quedan registradas y persisten tras borrar la cuenta', async () => {
      const Y = await createBareAccount('y');

      expect((await invite(org2, Y.email, 'mechanic')).status).toBe(201);
      expect(
        (
          await request(app, `/api/members/${Y.userId}/role`, {
            ...as(A, org2),
            method: 'PATCH',
            body: { role: 'receptionist' },
          })
        ).status,
      ).toBe(200);
      expect(
        (
          await request(app, `/api/organizations/${org2}`, {
            token: A.token,
            method: 'PATCH',
            body: { description: 'Auditada' },
          })
        ).status,
      ).toBe(200);
      const workshop = await request<{ workshop: { id: string } }>(app, '/api/workshops', {
        ...as(A, org2),
        method: 'POST',
        body: { name: `Auditado ${unique()}` },
      });
      expect(
        (
          await request(app, `/api/workshops/${workshop.body.workshop.id}/deactivate`, {
            ...as(A, org2),
            method: 'POST',
          })
        ).status,
      ).toBe(200);
      const client = await request<{ client: { id: string } }>(app, '/api/clients', {
        ...as(A, org2),
        method: 'POST',
        body: { first_name: 'Baja', last_name: unique() },
      });
      expect(
        (await request(app, `/api/clients/${client.body.client.id}/deactivate`, { ...as(A, org2), method: 'POST' }))
          .status,
      ).toBe(200);
      expect((await request(app, `/api/members/${Y.userId}`, { ...as(A, org2), method: 'DELETE' })).status).toBe(204);

      type Entry = {
        action: string;
        performed_by: string;
        created_at: string;
        entity_id: string;
        workshop_id: string | null;
      };
      const readAudit = async () => (await request<{ entries: Entry[] }>(app, '/api/audit', as(A, org2))).body.entries;

      const entries = await readAudit();
      for (const action of [
        'member.invited',
        'member.role_changed',
        'member.removed',
        'organization.updated',
        'workshop.deactivated',
        'client.deactivated',
      ]) {
        const entry = entries.find((e) => e.action === action);
        expect(entry, action).toBeDefined();
        expect(entry!.performed_by).toBe(A.userId);
        expect(Number.isNaN(Date.parse(entry!.created_at))).toBe(false);
      }
      expect(entries.find((e) => e.action === 'workshop.deactivated')!.workshop_id).toBe(workshop.body.workshop.id);

      // CP-703.7: la cuenta referenciada desaparece; el registro no.
      await deleteAccount(Y.userId);
      const after = await readAudit();
      expect(
        after
          .filter((e) => e.entity_id === Y.userId)
          .map((e) => e.action)
          .sort(),
      ).toEqual(['member.invited', 'member.removed', 'member.role_changed'].sort());
    });

    it('CP-704.1 — un Mechanic o un Receptionist que consulta la auditoría recibe 403', async () => {
      for (const account of [M, R]) {
        expectStatus(await request(app, '/api/audit', as(account, org1)), 403, 'audit.insufficient_permissions');
      }
    });
  });
});
