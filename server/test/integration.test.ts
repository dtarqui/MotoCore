import { describe, it, expect, beforeAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createApp } from '../src/app.js';

/**
 * Nivel N3 del plan de pruebas: integracion contra un Supabase REAL con las
 * migraciones aplicadas. Se salta automaticamente si no hay credenciales.
 *
 * Los casos omitidos NO cuentan como cumplidos (§6.2 del plan de pruebas): un
 * informe con casos saltados en N3 no constituye evidencia.
 *
 * Requisitos para correrlo:
 *   1. Un proyecto Supabase con `supabase/migrations/*.sql` aplicadas, incluida
 *      0007_audit_owner_policy.sql.
 *   2. Variables SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY.
 *   3. AUTH_AUTO_CONFIRM_EMAIL=true (para iniciar sesion sin confirmar correo).
 *
 * Cada `it` lleva el identificador CP-nnn de la matriz de trazabilidad, para
 * que la evidencia se lea contra el plan de pruebas sin traduccion intermedia.
 */
const hasEnv = Boolean(
  process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const rnd = () => Math.random().toString(36).slice(2, 10);

describe.skipIf(!hasEnv)('integracion multiorganizacion (Supabase real)', () => {
  const app = createApp();
  let anon: SupabaseClient;

  const userA = { email: `a_${rnd()}@motocore.test`, password: 'supersecret1' };
  const userB = { email: `b_${rnd()}@motocore.test`, password: 'supersecret1' };
  let tokenA = '';
  let tokenB = '';
  let orgAId = '';
  let userBId = '';

  async function register(email: string, password: string, organizationName: string) {
    return app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, firstName: 'Test', lastName: 'User', organizationName }),
    });
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await anon.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.session!.access_token;
  }

  /** Cabeceras con credencial y contexto activo (ADR-005). */
  const ctx = (token: string, orgId?: string, workshopId?: string): Record<string, string> => {
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
    if (orgId) headers['X-Org-Id'] = orgId;
    if (workshopId) headers['X-Workshop-Id'] = workshopId;
    return headers;
  };

  const authed = (token: string, init: RequestInit = {}) => ({
    ...init,
    headers: { ...(init.headers ?? {}), ...ctx(token) },
  });

  /** Codigo `modulo.razon` que viaja en `title` del Problem Details (RNF-204). */
  const codeOf = async (res: Response) => ((await res.json()) as { title: string }).title;

  beforeAll(async () => {
    anon = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const resA = await register(userA.email, userA.password, 'Motos del Sur');
    expect(resA.status).toBe(201);
    orgAId = ((await resA.json()) as { organization: { id: string } }).organization.id;

    const resB = await register(userB.email, userB.password, 'Motos del Norte');
    expect(resB.status).toBe(201);
    userBId = ((await resB.json()) as { userId: string }).userId;

    tokenA = await signIn(userA.email, userA.password);
    tokenB = await signIn(userB.email, userB.password);
  });

  // ================================================================
  // Identidad y organizaciones — CP-101, CP-104, CP-201..CP-204
  // ================================================================

  it('CP-101.1 — el registro crea organizacion, taller y membresia owner', async () => {
    const res = await app.request('/api/auth/me', authed(tokenA));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { organizations: Array<{ role: string }> };
    expect(body.organizations).toHaveLength(1);
    expect(body.organizations[0]!.role).toBe('owner');
  });

  it('CP-101.2 — un correo ya registrado se rechaza con 409 auth.email_already_registered', async () => {
    const res = await register(userA.email, userA.password, 'Duplicada');
    expect(res.status).toBe(409);
    expect(await codeOf(res)).toBe('auth.email_already_registered');
  });

  it('CP-201 — una cuenta puede crear organizaciones adicionales y queda owner', async () => {
    const create = await app.request(
      '/api/organizations',
      authed(tokenA, { method: 'POST', body: JSON.stringify({ name: `Segunda ${rnd()}` }) }),
    );
    expect(create.status).toBe(201);

    const list = await app.request('/api/organizations', authed(tokenA));
    const body = (await list.json()) as { organizations: Array<{ role: string }> };
    expect(body.organizations.length).toBeGreaterThanOrEqual(2);
    expect(body.organizations.every((o) => o.role === 'owner')).toBe(true);
  });

  it('CP-203.2 — activar una organizacion sin membresia responde 403 organization.access_denied', async () => {
    const res = await app.request(`/api/organizations/${orgAId}/switch`, authed(tokenB, { method: 'POST' }));
    expect(res.status).toBe(403);
    expect(await codeOf(res)).toBe('organization.access_denied');
  });

  it('CP-202 — una cuenta ajena no accede a la organizacion (aislamiento via API)', async () => {
    const res = await app.request(`/api/organizations/${orgAId}`, authed(tokenB));
    expect(res.status).toBe(403);
  });

  it('regla de rutas §2.3 — las rutas anidadas bajo la organizacion ya no existen', async () => {
    // Con credencial valida, el 404 distingue "no hay handler" de "no
    // autenticado": es lo que no puede comprobarse sin Supabase.
    for (const ruta of [
      `/api/organizations/${orgAId}/workshops`,
      `/api/organizations/${orgAId}/members`,
      `/api/organizations/${orgAId}/members/invite`,
    ]) {
      expect((await app.request(ruta, authed(tokenA))).status, ruta).toBe(404);
    }
  });

  // ================================================================
  // Miembros — CP-401..CP-407. Rutas resueltas por cabecera (ADR-005).
  // ================================================================

  describe('miembros', () => {
    it('CP-401.1 — tras invitar, la cuenta invitada ya accede', async () => {
      const invite = await app.request('/api/members/invite', {
        method: 'POST',
        headers: ctx(tokenA, orgAId),
        body: JSON.stringify({ email: userB.email, role: 'mechanic' }),
      });
      expect(invite.status).toBe(201);

      const res = await app.request(`/api/organizations/${orgAId}`, authed(tokenB));
      expect(res.status).toBe(200);
    });

    it('CP-401.2 — un correo sin cuenta responde 404 member.not_found', async () => {
      const res = await app.request('/api/members/invite', {
        method: 'POST',
        headers: ctx(tokenA, orgAId),
        body: JSON.stringify({ email: `fantasma_${rnd()}@motocore.test`, role: 'mechanic' }),
      });
      expect(res.status).toBe(404);
      expect(await codeOf(res)).toBe('member.not_found');
    });

    it('CP-406 — un no-owner que intenta invitar recibe 403 member.insufficient_permissions', async () => {
      const res = await app.request('/api/members/invite', {
        method: 'POST',
        headers: ctx(tokenB, orgAId),
        body: JSON.stringify({ email: 'x@motocore.test', role: 'receptionist' }),
      });
      expect(res.status).toBe(403);
      expect(await codeOf(res)).toBe('member.insufficient_permissions');
    });

    it('CP-407 — cualquier miembro consulta el listado con rol y estado', async () => {
      const res = await app.request('/api/members', { headers: ctx(tokenB, orgAId) });
      expect(res.status).toBe(200);
      const body = (await res.json()) as { members: Array<{ userId: string; role: string; isActive: boolean }> };
      expect(body.members.some((m) => m.userId === userBId && m.role === 'mechanic')).toBe(true);
    });

    it('CP-405 — no se puede cambiar el rol del propietario ni removerlo', async () => {
      const ownerId = ((await (await app.request('/api/auth/me', authed(tokenA))).json()) as { userId: string })
        .userId;

      const role = await app.request(`/api/members/${ownerId}/role`, {
        method: 'PATCH',
        headers: ctx(tokenA, orgAId),
        body: JSON.stringify({ role: 'mechanic' }),
      });
      expect(role.status).toBe(403);
      expect(await codeOf(role)).toBe('member.owner_protected');

      const remove = await app.request(`/api/members/${ownerId}`, {
        method: 'DELETE',
        headers: ctx(tokenA, orgAId),
      });
      expect(remove.status).toBe(403);
      expect(await codeOf(remove)).toBe('member.owner_protected');
    });

    it('CP-402 — no se admite el rol owner ni al invitar ni al cambiar de rol', async () => {
      const invitar = await app.request('/api/members/invite', {
        method: 'POST',
        headers: ctx(tokenA, orgAId),
        body: JSON.stringify({ email: userB.email, role: 'owner' }),
      });
      expect(invitar.status).toBe(403);
      expect(await codeOf(invitar)).toBe('member.owner_role_forbidden');

      const ascender = await app.request(`/api/members/${userBId}/role`, {
        method: 'PATCH',
        headers: ctx(tokenA, orgAId),
        body: JSON.stringify({ role: 'owner' }),
      });
      expect(ascender.status).toBe(403);
      expect(await codeOf(ascender)).toBe('member.owner_role_forbidden');

      // Un rol inexistente si es entrada mal formada: 400, no 403.
      const inventado = await app.request('/api/members/invite', {
        method: 'POST',
        headers: ctx(tokenA, orgAId),
        body: JSON.stringify({ email: userB.email, role: 'jefe' }),
      });
      expect(inventado.status).toBe(400);
      expect(await codeOf(inventado)).toBe('validation.invalid_body');
    });

    it('CP-401.3 — reincorporar a alguien removido reactiva su membresia, no la duplica', async () => {
      // Se crea una tercera cuenta para no alterar el estado de B, que otros
      // casos siguen usando como mechanic de la organizacion A.
      const userC = { email: `c_${rnd()}@motocore.test`, password: 'supersecret1' };
      expect((await register(userC.email, userC.password, 'Motos del Este')).status).toBe(201);

      const invitar = (role: 'mechanic' | 'receptionist') =>
        app.request('/api/members/invite', {
          method: 'POST',
          headers: ctx(tokenA, orgAId),
          body: JSON.stringify({ email: userC.email, role }),
        });

      const primera = await invitar('mechanic');
      expect(primera.status).toBe(201);
      const userCId = ((await primera.json()) as { userId: string }).userId;

      // Ya es miembro activo: la segunda invitacion es un duplicado.
      expect((await invitar('mechanic')).status).toBe(409);

      const remove = await app.request(`/api/members/${userCId}`, {
        method: 'DELETE',
        headers: ctx(tokenA, orgAId),
      });
      expect(remove.status).toBe(204);

      // CP-404: el removido pierde el acceso de inmediato.
      const tokenC = await signIn(userC.email, userC.password);
      const sinAcceso = await app.request('/api/clients', { headers: ctx(tokenC, orgAId) });
      expect(sinAcceso.status).toBe(403);

      // Reincorporacion con otro rol: reactiva la fila existente.
      expect((await invitar('receptionist')).status).toBe(201);

      const lista = await app.request('/api/members', { headers: ctx(tokenA, orgAId) });
      const body = (await lista.json()) as { members: Array<{ userId: string; role: string }> };
      const filas = body.members.filter((m) => m.userId === userCId);
      expect(filas).toHaveLength(1);
      expect(filas[0]!.role).toBe('receptionist');
    });
  });

  // ================================================================
  // Jerarquia organizacion -> talleres — CP-301..CP-305
  // ================================================================

  describe('talleres', () => {
    let workshop1 = '';
    let workshop2 = '';

    beforeAll(async () => {
      // El registro ya creo el primer taller (RF-101).
      const list = await app.request('/api/workshops', { headers: ctx(tokenA, orgAId) });
      const body = (await list.json()) as { workshops: Array<{ id: string }> };
      expect(body.workshops.length).toBeGreaterThanOrEqual(1);
      workshop1 = body.workshops[0]!.id;

      const create = await app.request('/api/workshops', {
        method: 'POST',
        headers: ctx(tokenA, orgAId),
        body: JSON.stringify({ name: 'Taller Sur' }),
      });
      expect(create.status).toBe(201);
      workshop2 = ((await create.json()) as { workshop: { id: string } }).workshop.id;
    });

    it('CP-301.1 — el taller creado aparece en el listado de la organizacion', async () => {
      const res = await app.request('/api/workshops', { headers: ctx(tokenA, orgAId) });
      const body = (await res.json()) as { workshops: unknown[] };
      expect(body.workshops.length).toBeGreaterThanOrEqual(2);
    });

    it('CP-301.2 — un no-owner que intenta crear recibe 403 workshop.insufficient_permissions', async () => {
      const res = await app.request('/api/workshops', {
        method: 'POST',
        headers: ctx(tokenB, orgAId),
        body: JSON.stringify({ name: `Prohibido ${rnd()}` }),
      });
      expect(res.status).toBe(403);
      expect(await codeOf(res)).toBe('workshop.insufficient_permissions');
    });

    it('no admite dos talleres con el mismo nombre en la organizacion (409 workshop.duplicate_name)', async () => {
      const res = await app.request('/api/workshops', {
        method: 'POST',
        headers: ctx(tokenA, orgAId),
        body: JSON.stringify({ name: 'Taller Sur' }),
      });
      expect(res.status).toBe(409);
      expect(await codeOf(res)).toBe('workshop.duplicate_name');
    });

    it('CP-303.2 — un taller de otra organizacion responde 404 workshop.not_found', async () => {
      const res = await app.request('/api/inventory/parts', {
        headers: ctx(tokenA, orgAId, '00000000-0000-0000-0000-000000000000'),
      });
      // Regla de no divulgacion (RNF-105): indistinguible de uno inexistente.
      expect(res.status).toBe(404);
      expect(await codeOf(res)).toBe('workshop.not_found');
    });

    it('CP-303.1 — sin taller activo responde 400 workshop.missing_active_workshop', async () => {
      const res = await app.request('/api/inventory/parts', { headers: ctx(tokenA, orgAId) });
      expect(res.status).toBe(400);
      expect(await codeOf(res)).toBe('workshop.missing_active_workshop');
    });

    it('CP-305 — la baja logica del taller es POST /deactivate y conserva sus datos', async () => {
      const create = await app.request('/api/workshops', {
        method: 'POST',
        headers: ctx(tokenA, orgAId),
        body: JSON.stringify({ name: `Efimero ${rnd()}` }),
      });
      const id = ((await create.json()) as { workshop: { id: string } }).workshop.id;

      // §2.6 del contrato: una transicion de estado auditada no se modela como
      // edicion de campo. El PATCH sobre esa sub-ruta no debe existir.
      const conPatch = await app.request(`/api/workshops/${id}/deactivate`, {
        method: 'PATCH',
        headers: ctx(tokenA, orgAId),
      });
      expect(conPatch.status).toBe(404);

      const res = await app.request(`/api/workshops/${id}/deactivate`, {
        method: 'POST',
        headers: ctx(tokenA, orgAId),
      });
      expect(res.status).toBe(200);
      expect(((await res.json()) as { workshop: { is_active: boolean } }).workshop.is_active).toBe(false);

      // Sus datos siguen consultables.
      const read = await app.request(`/api/workshops/${id}`, { headers: ctx(tokenA, orgAId) });
      expect(read.status).toBe(200);
    });

    it('CP-304.1 — la asignacion se registra y se retira sin afectar la membresia', async () => {
      const asignar = await app.request(`/api/workshops/${workshop1}/assignments`, {
        method: 'POST',
        headers: ctx(tokenA, orgAId),
        body: JSON.stringify({ userId: userBId }),
      });
      expect(asignar.status).toBe(201);

      const lista = await app.request(`/api/workshops/${workshop1}/assignments`, {
        headers: ctx(tokenA, orgAId),
      });
      const body = (await lista.json()) as { assignments: Array<{ userId: string | null }> };
      expect(body.assignments.some((a) => a.userId === userBId)).toBe(true);

      const quitar = await app.request(`/api/workshops/${workshop1}/assignments/${userBId}`, {
        method: 'DELETE',
        headers: ctx(tokenA, orgAId),
      });
      expect(quitar.status).toBe(204);

      // La membresia sigue viva: la asignacion es operativa (ADR-006).
      const miembros = await app.request('/api/members', { headers: ctx(tokenA, orgAId) });
      const m = (await miembros.json()) as { members: Array<{ userId: string; isActive: boolean }> };
      expect(m.members.find((x) => x.userId === userBId)?.isActive).toBe(true);
    });

    it('CP-304.2 — la asignacion NO altera lo que el miembro puede ver (ADR-006)', async () => {
      // B no esta asignado a workshop2, y aun asi lee su inventario: lo que
      // filtra es el taller activo de la peticion, no la asignacion.
      const res = await app.request('/api/inventory/parts', { headers: ctx(tokenB, orgAId, workshop2) });
      expect(res.status).toBe(200);
    });

    // ------------------------------------------------------------
    // Clientes: nivel ORGANIZACION — CP-501..CP-505
    // ------------------------------------------------------------

    it('CP-502 — un cliente creado con un taller activo se lista con otro', async () => {
      const email = `cli_${rnd()}@motocore.test`;
      const create = await app.request('/api/clients', {
        method: 'POST',
        headers: ctx(tokenA, orgAId, workshop1),
        body: JSON.stringify({ firstName: 'Ana', lastName: 'Quispe', email }),
      });
      expect(create.status).toBe(201);
      const clientId = ((await create.json()) as { client: { id: string } }).client.id;

      // Misma organizacion, OTRO taller: debe verse igual.
      const read = await app.request(`/api/clients/${clientId}`, {
        headers: ctx(tokenA, orgAId, workshop2),
      });
      expect(read.status).toBe(200);
    });

    it('CP-503.1 y CP-503.2 — el correo es unico por organizacion, no entre organizaciones', async () => {
      const email = `dup_${rnd()}@motocore.test`;
      const body = JSON.stringify({ firstName: 'Luis', lastName: 'Mamani', email });

      const enA = await app.request('/api/clients', { method: 'POST', headers: ctx(tokenA, orgAId), body });
      expect(enA.status).toBe(201);

      const duplicado = await app.request('/api/clients', {
        method: 'POST',
        headers: ctx(tokenA, orgAId),
        body,
      });
      expect(duplicado.status).toBe(409);
      expect(await codeOf(duplicado)).toBe('client.duplicate_email');

      // CP-503.2: el mismo correo en OTRA organizacion se acepta.
      const orgsB = (await (await app.request('/api/organizations', authed(tokenB))).json()) as {
        organizations: Array<{ organization: { id: string } }>;
      };
      const orgBId = orgsB.organizations[0]!.organization.id;
      const enB = await app.request('/api/clients', { method: 'POST', headers: ctx(tokenB, orgBId), body });
      expect(enB.status).toBe(201);
    });

    it('CP-504.1 y CP-504.2 — baja logica por POST, y busqueda dentro de la organizacion', async () => {
      const apellido = `Baja${rnd()}`;
      const create = await app.request('/api/clients', {
        method: 'POST',
        headers: ctx(tokenA, orgAId),
        body: JSON.stringify({ firstName: 'Rosa', lastName: apellido }),
      });
      const clientId = ((await create.json()) as { client: { id: string } }).client.id;

      // CP-504.2: la busqueda opera dentro de la organizacion activa.
      const buscar = await app.request(`/api/clients?search=${apellido}`, {
        headers: ctx(tokenA, orgAId),
      });
      const encontrados = (await buscar.json()) as { clients: Array<{ id: string }> };
      expect(encontrados.clients.some((x) => x.id === clientId)).toBe(true);

      // CP-504.1: la baja es POST /deactivate (§2.6), no PATCH.
      const conPatch = await app.request(`/api/clients/${clientId}/deactivate`, {
        method: 'PATCH',
        headers: ctx(tokenA, orgAId),
      });
      expect(conPatch.status).toBe(404);

      const baja = await app.request(`/api/clients/${clientId}/deactivate`, {
        method: 'POST',
        headers: ctx(tokenA, orgAId),
      });
      expect(baja.status).toBe(200);

      // Sale de los listados activos, pero el registro se conserva.
      const activos = await app.request(`/api/clients?search=${apellido}`, { headers: ctx(tokenA, orgAId) });
      expect(((await activos.json()) as { clients: unknown[] }).clients).toHaveLength(0);

      const conBajas = await app.request(`/api/clients?search=${apellido}&includeInactive=true`, {
        headers: ctx(tokenA, orgAId),
      });
      expect(((await conBajas.json()) as { clients: unknown[] }).clients).toHaveLength(1);
    });

    it('CP-505 — el Mechanic consulta clientes pero no los crea', async () => {
      const leer = await app.request('/api/clients', { headers: ctx(tokenB, orgAId) });
      expect(leer.status).toBe(200);

      const escribir = await app.request('/api/clients', {
        method: 'POST',
        headers: ctx(tokenB, orgAId),
        body: JSON.stringify({ firstName: 'No', lastName: 'Permitido' }),
      });
      expect(escribir.status).toBe(403);
      expect(await codeOf(escribir)).toBe('client.insufficient_permissions');
    });

    // ------------------------------------------------------------
    // Inventario: nivel TALLER — CP-601..CP-609
    // ------------------------------------------------------------

    it('CP-601, CP-602 y CP-603 — el inventario es por taller y el numero de parte se repite entre talleres', async () => {
      const partNumber = `PN-${rnd()}`;
      const make = (workshopId: string) =>
        app.request('/api/inventory/parts', {
          method: 'POST',
          headers: ctx(tokenA, orgAId, workshopId),
          body: JSON.stringify({ partNumber, name: 'Pastilla de freno', initialStock: 5 }),
        });

      const inOne = await make(workshop1);
      expect(inOne.status).toBe(201);
      const partOneId = ((await inOne.json()) as { part: { id: string } }).part.id;

      // CP-603.2: el mismo numero de parte se acepta en otro taller.
      expect((await make(workshop2)).status).toBe(201);

      // CP-603.1: duplicado en el MISMO taller.
      const duplicado = await make(workshop1);
      expect(duplicado.status).toBe(409);
      expect(await codeOf(duplicado)).toBe('inventory.duplicate_part_number');

      // CP-602: el repuesto del taller 1 no existe para el taller 2.
      const cross = await app.request(`/api/inventory/parts/${partOneId}`, {
        headers: ctx(tokenA, orgAId, workshop2),
      });
      expect(cross.status).toBe(404);
    });

    it('CP-604.1 y CP-605 — la existencia se recalcula segun el tipo de movimiento', async () => {
      const headers = ctx(tokenA, orgAId, workshop1);

      const create = await app.request('/api/inventory/parts', {
        method: 'POST',
        headers,
        body: JSON.stringify({ partNumber: `MOV-${rnd()}`, name: 'Bujia', initialStock: 100 }),
      });
      const partId = ((await create.json()) as { part: { id: string } }).part.id;

      const move = (movementType: string, quantity: number) =>
        app.request(`/api/inventory/parts/${partId}/movements`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ movementType, quantity }),
        });

      const stock = async () => {
        const res = await app.request(`/api/inventory/parts/${partId}`, { headers });
        return ((await res.json()) as { part: { current_stock: number } }).part.current_stock;
      };

      expect(await stock()).toBe(100); // el alta genero su movimiento de entrada

      await move('sale', 30);
      expect(await stock()).toBe(70);

      await move('purchase', 10);
      expect(await stock()).toBe(80);

      await move('damaged', 5);
      expect(await stock()).toBe(75);

      await move('return', 5);
      expect(await stock()).toBe(80);

      // El ajuste FIJA el valor, no lo suma.
      await move('adjustment', 42);
      expect(await stock()).toBe(42);
    });

    it('CP-604.2 — el tipo transferencia no se admite en el registro directo', async () => {
      const headers = ctx(tokenA, orgAId, workshop1);
      const create = await app.request('/api/inventory/parts', {
        method: 'POST',
        headers,
        body: JSON.stringify({ partNumber: `TRF-${rnd()}`, name: 'Manubrio', initialStock: 5 }),
      });
      const partId = ((await create.json()) as { part: { id: string } }).part.id;

      const res = await app.request(`/api/inventory/parts/${partId}/movements`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ movementType: 'transfer', quantity: 1 }),
      });
      // Lo genera la transferencia entre talleres (RF-608), nunca el usuario.
      expect(res.status).toBe(400);
    });

    it('CP-604.3 — los movimientos no admiten modificacion ni borrado', async () => {
      const headers = ctx(tokenA, orgAId, workshop1);
      const create = await app.request('/api/inventory/parts', {
        method: 'POST',
        headers,
        body: JSON.stringify({ partNumber: `INM-${rnd()}`, name: 'Espejo', initialStock: 2 }),
      });
      const partId = ((await create.json()) as { part: { id: string } }).part.id;

      for (const method of ['PATCH', 'PUT', 'DELETE']) {
        const res = await app.request(`/api/inventory/parts/${partId}/movements`, { method, headers });
        expect(res.status).not.toBe(200);
        expect(res.status).not.toBe(204);
      }
    });

    it('CP-606 — un movimiento que dejaria la existencia negativa se rechaza entero', async () => {
      const headers = ctx(tokenA, orgAId, workshop1);
      const create = await app.request('/api/inventory/parts', {
        method: 'POST',
        headers,
        body: JSON.stringify({ partNumber: `NEG-${rnd()}`, name: 'Cadena', initialStock: 3 }),
      });
      const partId = ((await create.json()) as { part: { id: string } }).part.id;

      const res = await app.request(`/api/inventory/parts/${partId}/movements`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ movementType: 'sale', quantity: 10 }),
      });
      expect(res.status).toBe(409);
      expect(await codeOf(res)).toBe('inventory.insufficient_stock');

      const after = await app.request(`/api/inventory/parts/${partId}`, { headers });
      expect(((await after.json()) as { part: { current_stock: number } }).part.current_stock).toBe(3);
    });

    it('CP-604.1 — el historial guarda existencia anterior y posterior', async () => {
      const headers = ctx(tokenA, orgAId, workshop1);
      const create = await app.request('/api/inventory/parts', {
        method: 'POST',
        headers,
        body: JSON.stringify({ partNumber: `HIS-${rnd()}`, name: 'Aceite', initialStock: 20 }),
      });
      const partId = ((await create.json()) as { part: { id: string } }).part.id;

      await app.request(`/api/inventory/parts/${partId}/movements`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ movementType: 'sale', quantity: 4 }),
      });

      const res = await app.request(`/api/inventory/parts/${partId}/movements`, { headers });
      const body = (await res.json()) as {
        movements: Array<{ previous_stock: number; new_stock: number; movement_type: string }>;
      };
      expect(body.movements.length).toBe(2); // alta + venta
      const sale = body.movements.find((m) => m.movement_type === 'sale')!;
      expect(sale.previous_stock).toBe(20);
      expect(sale.new_stock).toBe(16);
    });

    it('CP-607 — el listado de bajo stock devuelve solo los que estan en o bajo el minimo', async () => {
      const headers = ctx(tokenA, orgAId, workshop2);
      const partNumber = `LOW-${rnd()}`;
      await app.request('/api/inventory/parts', {
        method: 'POST',
        headers,
        body: JSON.stringify({ partNumber, name: 'Foco', initialStock: 2, minimumStock: 5 }),
      });

      const res = await app.request('/api/inventory/parts?lowStock=true', { headers });
      const body = (await res.json()) as { parts: Array<{ part_number: string }> };
      expect(body.parts.some((p) => p.part_number === partNumber)).toBe(true);
    });

    it('CP-608.1 y CP-608.2 — la transferencia mueve existencias y se rechaza entera si falta stock', async () => {
      const partNumber = `TR-${rnd()}`;
      const crear = (workshopId: string, initialStock: number) =>
        app.request('/api/inventory/parts', {
          method: 'POST',
          headers: ctx(tokenA, orgAId, workshopId),
          body: JSON.stringify({ partNumber, name: 'Piñon', initialStock }),
        });

      const origen = ((await (await crear(workshop1, 10)).json()) as { part: { id: string } }).part.id;
      const destino = ((await (await crear(workshop2, 0)).json()) as { part: { id: string } }).part.id;

      const transferir = (quantity: number) =>
        app.request(`/api/inventory/parts/${origen}/transfer`, {
          method: 'POST',
          headers: ctx(tokenA, orgAId, workshop1),
          body: JSON.stringify({ toWorkshopId: workshop2, toPartId: destino, quantity }),
        });

      expect((await transferir(4)).status).toBe(201);

      const leer = async (id: string, workshopId: string) => {
        const res = await app.request(`/api/inventory/parts/${id}`, {
          headers: ctx(tokenA, orgAId, workshopId),
        });
        return ((await res.json()) as { part: { current_stock: number } }).part.current_stock;
      };
      expect(await leer(origen, workshop1)).toBe(6);
      expect(await leer(destino, workshop2)).toBe(4);

      // CP-608.2: sin existencia suficiente, no queda a medias.
      const fallida = await transferir(999);
      expect(fallida.status).toBe(409);
      expect(await leer(origen, workshop1)).toBe(6);
      expect(await leer(destino, workshop2)).toBe(4);
    });

    it('CP-609 — el Mechanic no administra el catalogo ni transfiere, pero si registra movimientos', async () => {
      const headers = ctx(tokenA, orgAId, workshop1);
      const create = await app.request('/api/inventory/parts', {
        method: 'POST',
        headers,
        body: JSON.stringify({ partNumber: `ROL-${rnd()}`, name: 'Farol', initialStock: 10 }),
      });
      const partId = ((await create.json()) as { part: { id: string } }).part.id;

      const comoMechanic = ctx(tokenB, orgAId, workshop1);

      // Consulta: si puede.
      expect((await app.request('/api/inventory/parts', { headers: comoMechanic })).status).toBe(200);

      // Alta de catalogo: no.
      const alta = await app.request('/api/inventory/parts', {
        method: 'POST',
        headers: comoMechanic,
        body: JSON.stringify({ partNumber: `NOP-${rnd()}`, name: 'Prohibido' }),
      });
      expect(alta.status).toBe(403);
      expect(await codeOf(alta)).toBe('inventory.insufficient_permissions');

      // Edicion de catalogo: tampoco.
      const edicion = await app.request(`/api/inventory/parts/${partId}`, {
        method: 'PATCH',
        headers: comoMechanic,
        body: JSON.stringify({ name: 'Renombrado' }),
      });
      expect(edicion.status).toBe(403);

      // Transferencia: reservada al Owner.
      const transferencia = await app.request(`/api/inventory/parts/${partId}/transfer`, {
        method: 'POST',
        headers: comoMechanic,
        body: JSON.stringify({ toWorkshopId: workshop2, toPartId: partId, quantity: 1 }),
      });
      expect(transferencia.status).toBe(403);
      expect(await codeOf(transferencia)).toBe('inventory.insufficient_permissions');

      // Movimientos: si, porque el mecanico consume repuestos.
      const movimiento = await app.request(`/api/inventory/parts/${partId}/movements`, {
        method: 'POST',
        headers: comoMechanic,
        body: JSON.stringify({ movementType: 'sale', quantity: 1 }),
      });
      expect(movimiento.status).toBe(201);
    });

    // ------------------------------------------------------------
    // No divulgacion — CP-N105
    // ------------------------------------------------------------

    it('CP-N105 — un recurso ajeno y uno inexistente responden identico', async () => {
      // Cliente real de la organizacion de B, consultado desde la de A.
      const orgsB = (await (await app.request('/api/organizations', authed(tokenB))).json()) as {
        organizations: Array<{ organization: { id: string } }>;
      };
      const orgBId = orgsB.organizations[0]!.organization.id;

      const ajeno = await app.request('/api/clients', {
        method: 'POST',
        headers: ctx(tokenB, orgBId),
        body: JSON.stringify({ firstName: 'Ajeno', lastName: 'Invisible' }),
      });
      const ajenoId = ((await ajeno.json()) as { client: { id: string } }).client.id;

      const desdeA = await app.request(`/api/clients/${ajenoId}`, { headers: ctx(tokenA, orgAId) });
      const inexistente = await app.request('/api/clients/00000000-0000-0000-0000-000000000000', {
        headers: ctx(tokenA, orgAId),
      });

      expect(desdeA.status).toBe(inexistente.status);
      expect(desdeA.status).toBe(404);
      expect(await desdeA.json()).toEqual(await inexistente.json());
    });

    // ------------------------------------------------------------
    // Auditoria — CP-703
    // ------------------------------------------------------------

    it('CP-703.1 a CP-703.6 — las seis acciones criticas quedan registradas', async () => {
      const headers = ctx(tokenA, orgAId);

      // 1) Invitacion y 2) cambio de rol y 3) remocion, sobre una cuenta propia
      // del caso para no interferir con el resto de la suite.
      const userD = { email: `d_${rnd()}@motocore.test`, password: 'supersecret1' };
      expect((await register(userD.email, userD.password, 'Motos del Oeste')).status).toBe(201);

      const invitacion = await app.request('/api/members/invite', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: userD.email, role: 'mechanic' }),
      });
      expect(invitacion.status).toBe(201);
      const userDId = ((await invitacion.json()) as { userId: string }).userId;

      expect(
        (
          await app.request(`/api/members/${userDId}/role`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ role: 'receptionist' }),
          })
        ).status,
      ).toBe(200);

      expect(
        (await app.request(`/api/members/${userDId}`, { method: 'DELETE', headers })).status,
      ).toBe(204);

      // 4) Modificacion de los datos de la organizacion (RF-204).
      expect(
        (
          await app.request(`/api/organizations/${orgAId}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ phone: `7${Math.floor(1000000 + Math.random() * 8999999)}` }),
          })
        ).status,
      ).toBe(200);

      // 5) Desactivacion de un taller.
      const taller = await app.request('/api/workshops', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: `Auditado ${rnd()}` }),
      });
      const tallerId = ((await taller.json()) as { workshop: { id: string } }).workshop.id;
      expect(
        (await app.request(`/api/workshops/${tallerId}/deactivate`, { method: 'POST', headers })).status,
      ).toBe(200);

      // 6) Baja logica de un cliente.
      const cliente = await app.request('/api/clients', {
        method: 'POST',
        headers,
        body: JSON.stringify({ firstName: 'Audit', lastName: `Cliente${rnd()}` }),
      });
      const clienteId = ((await cliente.json()) as { client: { id: string } }).client.id;
      expect(
        (await app.request(`/api/clients/${clienteId}/deactivate`, { method: 'POST', headers })).status,
      ).toBe(200);

      const res = await app.request('/api/audit?limit=500', { headers });
      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        audit: Array<{ action: string; performedBy: string | null; createdAt: string }>;
      };
      const acciones = new Set(body.audit.map((e) => e.action));

      for (const accion of [
        'member.invited',
        'member.role_changed',
        'member.removed',
        'organization.updated',
        'workshop.deactivated',
        'client.deactivated',
      ]) {
        expect(acciones, `falta la accion auditada ${accion}`).toContain(accion);
      }

      // Cada entrada lleva autor y fecha (RF-703).
      for (const entrada of body.audit) {
        expect(entrada.performedBy).toBeTruthy();
        expect(entrada.createdAt).toBeTruthy();
      }
    });

    it('CP-703.7 — el registro persiste tras la baja de la entidad referenciada', async () => {
      const headers = ctx(tokenA, orgAId);

      const taller = await app.request('/api/workshops', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: `Persistente ${rnd()}` }),
      });
      const tallerId = ((await taller.json()) as { workshop: { id: string } }).workshop.id;
      await app.request(`/api/workshops/${tallerId}/deactivate`, { method: 'POST', headers });

      const res = await app.request(`/api/audit?action=workshop.deactivated&workshopId=${tallerId}`, {
        headers,
      });
      const body = (await res.json()) as { audit: Array<{ entityId: string | null }> };
      expect(body.audit.some((e) => e.entityId === tallerId)).toBe(true);
    });
  });
});
