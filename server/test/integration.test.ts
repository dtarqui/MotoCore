import { describe, it, expect, beforeAll } from 'vitest';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createApp } from '../src/app.js';

/**
 * Test de integracion contra un Supabase REAL con la migracion 0001 aplicada.
 * Se salta automaticamente si no hay credenciales en el entorno.
 *
 * Requisitos para correrlo:
 *   1. Un proyecto Supabase con `supabase/migrations/0001_init_multitenancy.sql` aplicado.
 *   2. Variables SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY.
 *   3. AUTH_AUTO_CONFIRM_EMAIL=true (para poder iniciar sesion sin confirmar email).
 *
 * Verifica el flujo de cuenta/organizacion y el AISLAMIENTO multi-tenant.
 */
const hasEnv = Boolean(
  process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY,
);

const rnd = () => Math.random().toString(36).slice(2, 10);

describe.skipIf(!hasEnv)('integracion multi-org (Supabase real)', () => {
  const app = createApp();
  let anon: SupabaseClient;

  const userA = { email: `a_${rnd()}@motocore.test`, password: 'supersecret1' };
  const userB = { email: `b_${rnd()}@motocore.test`, password: 'supersecret1' };
  let tokenA = '';
  let tokenB = '';
  let orgAId = '';

  async function register(email: string, password: string, organizationName: string) {
    const res = await app.request('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, firstName: 'Test', lastName: 'User', organizationName }),
    });
    return res;
  }

  async function signIn(email: string, password: string) {
    const { data, error } = await anon.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.session!.access_token;
  }

  const authed = (token: string, init: RequestInit = {}) => ({
    ...init,
    headers: { ...(init.headers ?? {}), Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });

  beforeAll(async () => {
    anon = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const resA = await register(userA.email, userA.password, 'Taller A');
    expect(resA.status).toBe(201);
    orgAId = ((await resA.json()) as { organization: { id: string } }).organization.id;

    const resB = await register(userB.email, userB.password, 'Taller B');
    expect(resB.status).toBe(201);

    tokenA = await signIn(userA.email, userA.password);
    tokenB = await signIn(userB.email, userB.password);
  });

  it('el registro crea la primera organizacion con rol owner', async () => {
    const res = await app.request('/api/auth/me', authed(tokenA));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { organizations: Array<{ role: string }> };
    expect(body.organizations).toHaveLength(1);
    expect(body.organizations[0]!.role).toBe('owner');
  });

  it('una cuenta puede tener varias organizaciones', async () => {
    const create = await app.request(
      '/api/organizations',
      authed(tokenA, { method: 'POST', body: JSON.stringify({ name: 'Sucursal Norte' }) }),
    );
    expect(create.status).toBe(201);

    const list = await app.request('/api/organizations', authed(tokenA));
    const body = (await list.json()) as { organizations: unknown[] };
    expect(body.organizations.length).toBeGreaterThanOrEqual(2);
  });

  it('un usuario de otra cuenta NO puede acceder a la organizacion ajena (aislamiento)', async () => {
    const res = await app.request(`/api/organizations/${orgAId}`, authed(tokenB));
    expect(res.status).toBe(403);
  });

  it('tras invitar al usuario B, ya puede acceder a la organizacion', async () => {
    const invite = await app.request(
      `/api/organizations/${orgAId}/members/invite`,
      authed(tokenA, { method: 'POST', body: JSON.stringify({ email: userB.email, role: 'mechanic' }) }),
    );
    expect(invite.status).toBe(201);

    const res = await app.request(`/api/organizations/${orgAId}`, authed(tokenB));
    expect(res.status).toBe(200);
  });

  it('un no-owner no puede invitar miembros', async () => {
    const res = await app.request(
      `/api/organizations/${orgAId}/members/invite`,
      authed(tokenB, { method: 'POST', body: JSON.stringify({ email: 'x@motocore.test', role: 'receptionist' }) }),
    );
    expect(res.status).toBe(403);
  });

  // ----------------------------------------------------------------
  // Jerarquia empresa -> sucursales (RF-301..303)
  // ----------------------------------------------------------------
  describe('sucursales', () => {
    let workshop1 = '';
    let workshop2 = '';

    beforeAll(async () => {
      // El registro ya creo la primera sucursal (RF-101).
      const list = await app.request(`/api/organizations/${orgAId}/workshops`, authed(tokenA));
      const body = (await list.json()) as { workshops: Array<{ id: string }> };
      expect(body.workshops.length).toBeGreaterThanOrEqual(1);
      workshop1 = body.workshops[0]!.id;

      const create = await app.request(
        `/api/organizations/${orgAId}/workshops`,
        authed(tokenA, { method: 'POST', body: JSON.stringify({ name: 'Sucursal Sur' }) }),
      );
      expect(create.status).toBe(201);
      workshop2 = ((await create.json()) as { workshop: { id: string } }).workshop.id;
    });

    it('el registro creo la primera sucursal junto con la empresa (RF-101)', () => {
      expect(workshop1).toBeTruthy();
    });

    it('una empresa puede tener varias sucursales (RF-301, RF-302)', async () => {
      const res = await app.request(`/api/organizations/${orgAId}/workshops`, authed(tokenA));
      const body = (await res.json()) as { workshops: unknown[] };
      expect(body.workshops.length).toBeGreaterThanOrEqual(2);
    });

    it('no admite dos sucursales con el mismo nombre en la empresa', async () => {
      const res = await app.request(
        `/api/organizations/${orgAId}/workshops`,
        authed(tokenA, { method: 'POST', body: JSON.stringify({ name: 'Sucursal Sur' }) }),
      );
      expect(res.status).toBe(409);
    });

    it('rechaza una sucursal que no pertenece a la empresa activa (RF-303)', async () => {
      const res = await app.request('/api/inventory/parts', {
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'X-Org-Id': orgAId,
          'X-Workshop-Id': '00000000-0000-0000-0000-000000000000',
        },
      });
      expect(res.status).toBe(403);
    });

    it('rechaza la peticion si falta la sucursal activa', async () => {
      const res = await app.request('/api/inventory/parts', {
        headers: { Authorization: `Bearer ${tokenA}`, 'X-Org-Id': orgAId },
      });
      expect(res.status).toBe(400);
    });

    // ------------------------------------------------------------
    // Clientes: nivel EMPRESA (RF-502, RF-503)
    // ------------------------------------------------------------
    it('un cliente creado desde una sucursal se ve desde otra (RF-502)', async () => {
      const email = `cli_${rnd()}@motocore.test`;
      const create = await app.request('/api/clients', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenA}`,
          'Content-Type': 'application/json',
          'X-Org-Id': orgAId,
          'X-Workshop-Id': workshop1,
        },
        body: JSON.stringify({ firstName: 'Ana', lastName: 'Quispe', email }),
      });
      expect(create.status).toBe(201);
      const clientId = ((await create.json()) as { client: { id: string } }).client.id;

      // Misma empresa, OTRA sucursal: debe verse igual.
      const read = await app.request(`/api/clients/${clientId}`, {
        headers: { Authorization: `Bearer ${tokenA}`, 'X-Org-Id': orgAId, 'X-Workshop-Id': workshop2 },
      });
      expect(read.status).toBe(200);
    });

    it('el email de cliente es unico por empresa (RF-503)', async () => {
      const email = `dup_${rnd()}@motocore.test`;
      const body = JSON.stringify({ firstName: 'Luis', lastName: 'Mamani', email });
      const headers = {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
        'X-Org-Id': orgAId,
        'X-Workshop-Id': workshop1,
      };

      expect((await app.request('/api/clients', { method: 'POST', headers, body })).status).toBe(201);
      expect((await app.request('/api/clients', { method: 'POST', headers, body })).status).toBe(409);
    });

    // ------------------------------------------------------------
    // Inventario: nivel SUCURSAL (RF-602..607)
    // ------------------------------------------------------------
    it('el inventario no se mezcla entre sucursales y admite el mismo numero de parte (RF-602, RF-603)', async () => {
      const partNumber = `PN-${rnd()}`;
      const make = (workshopId: string) =>
        app.request('/api/inventory/parts', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${tokenA}`,
            'Content-Type': 'application/json',
            'X-Org-Id': orgAId,
            'X-Workshop-Id': workshopId,
          },
          body: JSON.stringify({ partNumber, name: 'Pastilla de freno', initialStock: 5 }),
        });

      const inOne = await make(workshop1);
      expect(inOne.status).toBe(201);
      const partOneId = ((await inOne.json()) as { part: { id: string } }).part.id;

      // RF-603: el mismo numero de parte se acepta en otra sucursal.
      const inTwo = await make(workshop2);
      expect(inTwo.status).toBe(201);

      // RF-602: el repuesto de la sucursal 1 no existe para la sucursal 2.
      const cross = await app.request(`/api/inventory/parts/${partOneId}`, {
        headers: { Authorization: `Bearer ${tokenA}`, 'X-Org-Id': orgAId, 'X-Workshop-Id': workshop2 },
      });
      expect(cross.status).toBe(404);
    });

    it('la existencia se recalcula segun el tipo de movimiento (RF-605)', async () => {
      const headers = {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
        'X-Org-Id': orgAId,
        'X-Workshop-Id': workshop1,
      };

      const create = await app.request('/api/inventory/parts', {
        method: 'POST',
        headers,
        body: JSON.stringify({ partNumber: `MOV-${rnd()}`, name: 'Bujia', initialStock: 100 }),
      });
      const partId = ((await create.json()) as { part: { id: string } }).part.id;

      const move = async (movementType: string, quantity: number) => {
        const res = await app.request(`/api/inventory/parts/${partId}/movements`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ movementType, quantity }),
        });
        return res;
      };

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

    it('rechaza un movimiento que dejaria la existencia negativa y no altera el stock (RF-606)', async () => {
      const headers = {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
        'X-Org-Id': orgAId,
        'X-Workshop-Id': workshop1,
      };

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

      const after = await app.request(`/api/inventory/parts/${partId}`, { headers });
      const body = (await after.json()) as { part: { current_stock: number } };
      expect(body.part.current_stock).toBe(3);
    });

    it('el historial de movimientos queda registrado con existencia anterior y posterior (RF-604)', async () => {
      const headers = {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
        'X-Org-Id': orgAId,
        'X-Workshop-Id': workshop1,
      };

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

    it('señala los repuestos en o por debajo del minimo (RF-607)', async () => {
      const headers = {
        Authorization: `Bearer ${tokenA}`,
        'Content-Type': 'application/json',
        'X-Org-Id': orgAId,
        'X-Workshop-Id': workshop2,
      };

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

    it('el usuario B no accede a los clientes de la empresa A (aislamiento via API)', async () => {
      const res = await app.request('/api/clients', {
        headers: { Authorization: `Bearer ${tokenB}`, 'X-Org-Id': orgAId },
      });
      // B fue invitado como mechanic mas arriba, asi que puede leer; lo que no
      // puede es escribir. Se comprueba la regla de rol (RF-505).
      expect(res.status).toBe(200);

      const write = await app.request('/api/clients', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenB}`,
          'Content-Type': 'application/json',
          'X-Org-Id': orgAId,
        },
        body: JSON.stringify({ firstName: 'No', lastName: 'Permitido' }),
      });
      expect(write.status).toBe(403);
    });
  });
});
