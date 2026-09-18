import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { expect } from 'vitest';
import type { createApp } from '../../src/app.js';

/**
 * Soporte de N3 y N4: pruebas contra un proyecto Supabase real con las
 * migraciones aplicadas. Sin credenciales, los casos se **omiten** — y un caso
 * omitido no cubre su requisito (Plan de pruebas, §7.2).
 */
export const hasEnv = Boolean(
  process.env.SUPABASE_URL && process.env.SUPABASE_PUBLISHABLE_KEY && process.env.SUPABASE_SECRET_KEY,
);

/** Sufijo irrepetible: cada ejecución crea sus propias cuentas (§3.4 del plan). */
export const unique = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

export const PASSWORD = 'secreto-de-prueba-1';

type App = ReturnType<typeof createApp>;

export interface Call {
  token?: string;
  org?: string;
  workshop?: string;
  method?: string;
  body?: unknown;
}

export interface Reply<T = Record<string, unknown>> {
  status: number;
  body: T;
}

/** Petición a la interfaz con credencial y contexto activo (ADR-005). */
export async function request<T = Record<string, unknown>>(app: App, path: string, call: Call = {}): Promise<Reply<T>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (call.token) headers.Authorization = `Bearer ${call.token}`;
  if (call.org) headers['X-Org-Id'] = call.org;
  if (call.workshop) headers['X-Workshop-Id'] = call.workshop;

  const res = await app.request(path, {
    method: call.method ?? 'GET',
    headers,
    body: call.body === undefined ? undefined : JSON.stringify(call.body),
  });
  const text = await res.text();
  return { status: res.status, body: (text ? JSON.parse(text) : null) as T };
}

/** Código `modulo.razon` de una respuesta de error (RNF-204). */
export const codeOf = (reply: Reply) => (reply.body as { title?: string } | null)?.title;

export function expectStatus(reply: Reply, status: number, code?: string): void {
  expect({ status: reply.status, code: code ? codeOf(reply) : undefined }).toEqual({ status, code });
}

function anonymous(): SupabaseClient {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Cliente de datos con la identidad de una cuenta y **sin pasar por la
 * interfaz**: el de la vía 2 del aislamiento (Plan de pruebas, §6.3). Nunca la
 * clave secreta, que saltaría las políticas y haría pasar cualquier prueba.
 */
export function clientAs(token: string): SupabaseClient {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

/** Inicio de sesión contra el proveedor de identidad, como lo hace el cliente web (ADR-004). */
export async function signIn(email: string): Promise<string> {
  const { data, error } = await anonymous().auth.signInWithPassword({ email, password: PASSWORD });
  if (error) throw error;
  return data.session!.access_token;
}

export interface Account {
  email: string;
  token: string;
  userId: string;
  orgId: string;
  workshopId: string;
}

/** Registra una cuenta con su primera organización y su primer taller, e inicia sesión. */
export async function registerAccount(
  app: App,
  prefix: string,
  organizationName: string,
  workshopName?: string,
): Promise<Account> {
  const email = `${prefix}_${unique()}@motocore.test`;
  const reply = await request<{ user_id: string; organization: { id: string }; workshop: { id: string } }>(
    app,
    '/api/auth/register',
    {
      method: 'POST',
      body: {
        email,
        password: PASSWORD,
        first_name: 'Prueba',
        last_name: prefix,
        organization_name: organizationName,
        workshop_name: workshopName,
      },
    },
  );
  expect(reply.status, JSON.stringify(reply.body)).toBe(201);

  return {
    email,
    token: await signIn(email),
    userId: reply.body.user_id,
    orgId: reply.body.organization.id,
    workshopId: reply.body.workshop.id,
  };
}

/**
 * Infraestructura del banco de pruebas con la API de administración, nunca
 * parte de lo que se verifica. El caso CP-703.7 necesita borrar una cuenta, y
 * una cuenta registrada por la interfaz no se puede borrar: es propietaria de
 * su organización, y `owner_id` lo impide a propósito. Por eso la cuenta que se
 * borra se crea directamente en el proveedor, sin organización propia.
 */
function admin(): SupabaseClient {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function createBareAccount(prefix: string): Promise<{ email: string; userId: string }> {
  const email = `${prefix}_${unique()}@motocore.test`;
  const { data, error } = await admin().auth.admin.createUser({ email, password: PASSWORD, email_confirm: true });
  if (error) throw error;
  return { email, userId: data.user.id };
}

export async function deleteAccount(userId: string): Promise<void> {
  const { error } = await admin().auth.admin.deleteUser(userId);
  if (error) throw error;
}
