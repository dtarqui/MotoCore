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
});
