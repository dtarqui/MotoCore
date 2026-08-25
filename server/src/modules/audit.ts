import { Hono } from 'hono';
import { serviceClient } from '../lib/supabase.js';
import { requireAuth } from '../lib/auth.js';
import { requireActiveOrg, type OrgBindings } from '../lib/org-context.js';
import { forbidden, internal } from '../lib/errors.js';

/**
 * Consulta del registro de auditoria — RF-703, RF-704.
 *
 * Es la UNICA lectura de la API reservada a un rol. La restriccion no se
 * sostiene solo aqui: la politica RLS de audit_log exige is_org_owner
 * (migracion 0007), de modo que el acceso directo a la base de datos tampoco
 * la elude. Esa doble aplicacion es lo que verifica CP-704.2.
 *
 * El registro es de solo lectura: no se expone ninguna operacion de
 * modificacion ni de borrado, porque es historial inmutable.
 */
export const auditRoutes = new Hono<OrgBindings>();

const AUDIT_COLUMNS =
  'id, organization_id, workshop_id, performed_by, action, entity, entity_id, details, created_at';

/** Numero maximo de entradas devueltas si el cliente no acota la consulta. */
const LIMITE_POR_DEFECTO = 100;
const LIMITE_MAXIMO = 500;

auditRoutes.use('*', requireAuth, requireActiveOrg);

/**
 * Lista las acciones criticas de la organizacion activa — RF-703, RF-704.
 *
 * Filtros opcionales: `action` (accion exacta), `workshopId` (taller al que se
 * refiere la accion) y `limit`.
 */
auditRoutes.get('/', async (c) => {
  // El catalogo de errores del contrato reserva un codigo propio para este
  // modulo, en lugar de reutilizar el generico de organizacion.
  if (c.get('orgRole') !== 'owner') {
    throw forbidden('audit.insufficient_permissions', 'Solo el Owner puede consultar la auditoria.');
  }

  const orgId = c.get('orgId');
  const action = c.req.query('action')?.trim();
  const workshopId = c.req.query('workshopId')?.trim();

  const limitePedido = Number.parseInt(c.req.query('limit') ?? '', 10);
  const limite = Number.isFinite(limitePedido)
    ? Math.min(Math.max(limitePedido, 1), LIMITE_MAXIMO)
    : LIMITE_POR_DEFECTO;

  // El registro se lee con la credencial de quien llama: la politica
  // `audit_log_select_owner` (migracion 0007) vuelve a exigir el rol en el
  // motor, de modo que la reserva al Owner no depende solo de este handler.
  let query = c.get('db')
    .from('mt_audit_log')
    .select(AUDIT_COLUMNS)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false })
    .limit(limite);

  if (action) query = query.eq('action', action);
  if (workshopId) query = query.eq('workshop_id', workshopId);

  const { data, error } = await query;
  if (error) throw internal('audit_log.select: ' + error.message);

  const entradas = data ?? [];

  // `performed_by` no tiene clave foranea: el registro debe sobrevivir al
  // borrado de la cuenta que ejecuto la accion. Por eso el perfil se resuelve
  // aparte y puede venir nulo — que lo sea es el comportamiento correcto, no
  // un fallo de la consulta.
  const autores = [
    ...new Set(
      entradas
        .map((e) => (e as { performed_by: string | null }).performed_by)
        .filter((id): id is string => Boolean(id)),
    ),
  ];

  // Los perfiles de otras cuentas exigen clave de servicio: `profiles_select_own`
  // solo deja leer el propio (ver `lib/supabase.ts`, excepcion 4).
  const perfilesPorId = new Map<string, Record<string, unknown>>();
  if (autores.length > 0) {
    const { data: perfiles } = await serviceClient()
      .from('mt_profiles')
      .select('id, email, first_name, last_name')
      .in('id', autores);
    for (const p of perfiles ?? []) {
      perfilesPorId.set((p as { id: string }).id, p as Record<string, unknown>);
    }
  }

  const result = entradas.map((e) => {
    const fila = e as Record<string, unknown>;
    const performedBy = fila.performed_by as string | null;
    return {
      id: fila.id,
      organizationId: fila.organization_id,
      workshopId: fila.workshop_id,
      performedBy,
      performedByProfile: performedBy ? (perfilesPorId.get(performedBy) ?? null) : null,
      action: fila.action,
      entity: fila.entity,
      entityId: fila.entity_id,
      details: fila.details,
      createdAt: fila.created_at,
    };
  });

  return c.json({ audit: result });
});
