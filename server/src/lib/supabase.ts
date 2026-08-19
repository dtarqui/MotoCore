import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getEnv } from './env.js';

const noSession = { auth: { persistSession: false, autoRefreshToken: false } };

let serviceSingleton: SupabaseClient | null = null;

/**
 * Cliente con clave de servicio: **salta las politicas RLS**.
 *
 * Su uso esta acotado a siete situaciones, cada una por un motivo que no admite
 * la via del usuario. Cualquier otro acceso a datos de negocio va por
 * `userClient` (ADR-002):
 *
 *  1. **La verificacion de membresia de la capa de aplicacion**
 *     (`lib/memberships.ts`, `lib/workshop-context.ts`). Es la razon de mas
 *     peso: si el control de la aplicacion consultara con el cliente del
 *     usuario, dependeria de RLS para funcionar, y las dos capas dejarian de
 *     ser independientes — que es justo lo que RNF-102 exige demostrar.
 *  2. **El registro** (`modules/auth.ts`): todavia no existe token de sesion.
 *  3. **La creacion de una organizacion y su primera membresia**: la politica
 *     `memberships_insert_owner` exige `is_org_owner`, y en ese instante el
 *     creador aun no es miembro. Es el arranque del ciclo.
 *  4. **Los perfiles de otros miembros**: `profiles_select_own` solo deja leer
 *     el propio. Exponer el de un co-miembro dentro de la organizacion es un
 *     privilegio acotado que RF-407 sanciona.
 *  5. **`get_user_id_by_email`**: concedida solo a `service_role` para no
 *     ofrecer un mecanismo de enumeracion de cuentas (RNF-106).
 *  6. **`register_part_movement` y `transfer_stock`**: concedidas solo a
 *     `service_role` (ADR-007).
 *  7. **La escritura del registro de auditoria**: debe ser infalsificable.
 *
 * Nunca exponer esta clave al cliente.
 */
export function serviceClient(): SupabaseClient {
  if (serviceSingleton) return serviceSingleton;
  const env = getEnv();
  serviceSingleton = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, noSession);
  return serviceSingleton;
}

/**
 * Cliente atado a la credencial de la peticion: **respeta RLS**, porque actua
 * con la identidad de quien llama.
 *
 * Es el cliente con el que se leen y escriben los datos de negocio, y es lo que
 * hace que el aislamiento del motor actue tambien en el camino de la API y no
 * solo en el acceso directo a la base de datos. Con el, una consulta que
 * escapara al control de la aplicacion seguiria sin devolver filas ajenas: las
 * politicas la filtran.
 *
 * Se construye una vez por peticion en `requireAuth` y viaja en el contexto;
 * los handlers lo toman con `c.get('db')` en lugar de crearlo de nuevo.
 */
export function userClient(accessToken: string): SupabaseClient {
  const env = getEnv();
  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    ...noSession,
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
