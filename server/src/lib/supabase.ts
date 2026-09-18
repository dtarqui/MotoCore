import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getEnv } from './env.js';

const noSession = { auth: { persistSession: false, autoRefreshToken: false } };

/**
 * Las siete excepciones de ADR-008: los **únicos** motivos por los que el
 * servidor consulta con la clave secreta, que salta las políticas RLS.
 *
 * Cualquier otro acceso a datos va por el cliente de la petición
 * (`c.get('db')`). Elegir el cliente equivocado no produce un error visible:
 * **desactiva en silencio** la capa de aislamiento del motor. Por eso cada
 * llamada a `serviceClient` declara cuál de estas excepciones la justifica, y
 * este tipo es el lugar único donde están enumeradas.
 *
 *  1. `membership-verification` — la verificación de membresía y de
 *     pertenencia del taller de la capa de aplicación. Es la de más peso: si
 *     consultara con la credencial de la petición, dependería de RLS para
 *     funcionar y las dos capas dejarían de ser independientes, que es justo lo
 *     que RNF-102 exige demostrar.
 *  2. `registration` — el alta de la cuenta: todavía no existe sesión.
 *  3. `organization-creation` — la organización y su membresía propietaria:
 *     ninguna política puede autorizarla, porque el solicitante aún no es
 *     miembro. Ocurre dentro de `mt_create_organization`.
 *  4. `member-profiles` — los perfiles de otros miembros: la política de
 *     `mt_profiles` solo deja leer el propio, y exponer el de un co-miembro de
 *     la organización activa es el privilegio acotado que sanciona RF-407.
 *  5. `account-lookup` — `mt_get_user_id_by_email`, concedida solo al servidor
 *     para no ofrecer un mecanismo de enumeración de cuentas (RNF-106).
 *  6. `inventory-atomic` — `mt_register_part_movement` y `mt_transfer_stock`,
 *     concedidas solo al servidor (ADR-007).
 *  7. `audit-write` — la escritura del registro de auditoría, que debe ser
 *     infalsificable (RN-15).
 */
export type PrivilegedUse =
  | 'membership-verification'
  | 'registration'
  | 'organization-creation'
  | 'member-profiles'
  | 'account-lookup'
  | 'inventory-atomic'
  | 'audit-write';

let serviceSingleton: SupabaseClient | null = null;
let publicSingleton: SupabaseClient | null = null;

/**
 * Cliente con la clave **secreta**: salta las políticas RLS. `use` nombra la
 * excepción que lo justifica. Nunca exponer esta clave al cliente (RNF-103).
 */
export function serviceClient(use: PrivilegedUse): SupabaseClient {
  void use;
  if (serviceSingleton) return serviceSingleton;
  const env = getEnv();
  serviceSingleton = createClient(env.supabaseUrl, env.supabaseSecretKey, noSession);
  return serviceSingleton;
}

/**
 * Cliente con la clave **publicable** y sin sesión. Sirve para lo que no toca
 * datos: verificar una credencial contra el proveedor de identidad (ADR-004).
 * No necesita ningún privilegio, de modo que no consume una excepción.
 */
export function publicClient(): SupabaseClient {
  if (publicSingleton) return publicSingleton;
  const env = getEnv();
  publicSingleton = createClient(env.supabaseUrl, env.supabasePublishableKey, noSession);
  return publicSingleton;
}

/**
 * Cliente atado a la credencial de la petición: **respeta RLS**, porque actúa
 * con la identidad de quien llama.
 *
 * Es el cliente con el que se leen y escriben los datos de negocio, y es lo que
 * hace que el aislamiento del motor actúe también en el camino de la API y no
 * solo en el acceso directo a la base de datos. Con él, una consulta que
 * escapara al control de la aplicación seguiría sin devolver filas ajenas: las
 * políticas la filtran.
 *
 * Se construye una vez por petición, en el middleware de autenticación, y
 * viaja en el contexto.
 */
export function userClient(accessToken: string): SupabaseClient {
  const env = getEnv();
  return createClient(env.supabaseUrl, env.supabasePublishableKey, {
    ...noSession,
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
