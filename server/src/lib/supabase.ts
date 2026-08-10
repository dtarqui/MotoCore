import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getEnv } from './env.js';

const noSession = { auth: { persistSession: false, autoRefreshToken: false } };

let serviceSingleton: SupabaseClient | null = null;

/**
 * Cliente con service-role: bypassa RLS. Usar solo en el servidor para
 * operaciones privilegiadas (crear usuarios, gestionar membresias). Nunca
 * exponer esta key al cliente.
 */
export function serviceClient(): SupabaseClient {
  if (serviceSingleton) return serviceSingleton;
  const env = getEnv();
  serviceSingleton = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, noSession);
  return serviceSingleton;
}

/**
 * Cliente atado al token del usuario: respeta RLS (actua "como" el usuario).
 * Util para lecturas donde queremos que las politicas hagan el aislamiento.
 */
export function userClient(accessToken: string): SupabaseClient {
  const env = getEnv();
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    ...noSession,
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
