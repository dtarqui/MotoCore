import type { MiddlewareHandler } from 'hono';
import { serviceClient } from './supabase.js';
import { badRequest, internal, notFound } from './errors.js';
import type { OrgBindings } from './org-context.js';

/**
 * Contexto de taller activo para los modulos de nivel taller (inventario, y
 * mas adelante ordenes de trabajo). Lee el header `X-Workshop-Id` (ADR-005).
 *
 * Se encadena SIEMPRE despues de `requireActiveOrg`, porque su trabajo es
 * comprobar que el taller pertenece a la organizacion activa (RF-303). Esa
 * comprobacion vive aqui, en la capa de aplicacion, y no en una politica RLS:
 * las politicas se evaluan solo sobre organization_id para mantener un unico
 * criterio de aislamiento en todo el esquema (ADR-006).
 */
export type WorkshopBindings = {
  Variables: OrgBindings['Variables'] & { workshopId: string };
};

export const requireActiveWorkshop: MiddlewareHandler<WorkshopBindings> = async (c, next) => {
  const workshopId = c.req.header('X-Workshop-Id')?.trim() ?? '';
  if (!workshopId) {
    throw badRequest('workshop.missing_active_workshop', 'Falta el taller activo (header X-Workshop-Id).');
  }

  await assertWorkshopInOrg(workshopId, c.get('orgId'));

  c.set('workshopId', workshopId);
  await next();
};

/**
 * Comprueba que el taller exista y pertenezca a la organizacion indicada.
 *
 * Un taller de otra organizacion responde `404 workshop.not_found`, exactamente
 * igual que uno inexistente (RNF-105, §5 del contrato): un `403` confirmaria
 * que ese identificador existe en alguna parte, y bastaria para enumerar los
 * talleres de un competidor probando identificadores.
 */
export async function assertWorkshopInOrg(workshopId: string, orgId: string): Promise<void> {
  const { data, error } = await serviceClient()
    .from('mt_workshops')
    .select('id, organization_id')
    .eq('id', workshopId)
    .maybeSingle();

  if (error) throw internal(`workshops.select: ${error.message}`);
  if (!data || (data as { organization_id: string }).organization_id !== orgId) {
    throw notFound('workshop.not_found', 'Taller no encontrado.');
  }
}
