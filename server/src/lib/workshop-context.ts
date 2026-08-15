import type { MiddlewareHandler } from 'hono';
import { serviceClient } from './supabase.js';
import { badRequest, forbidden } from './errors.js';
import type { OrgBindings } from './org-context.js';

/**
 * Contexto de sucursal activa para los modulos de nivel sucursal (inventario,
 * y mas adelante ordenes de trabajo). Lee el header `X-Workshop-Id` (ADR-005).
 *
 * Se encadena SIEMPRE despues de `requireActiveOrg`, porque su trabajo es
 * comprobar que la sucursal pertenece a la organizacion activa (RF-303). Esa
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
    throw badRequest('workshop.missing_active_workshop', 'Falta la sucursal activa (header X-Workshop-Id).');
  }

  await assertWorkshopInOrg(workshopId, c.get('orgId'));

  c.set('workshopId', workshopId);
  await next();
};

/**
 * Comprueba que la sucursal exista y pertenezca a la organizacion indicada.
 * Devuelve el mismo error tanto si la sucursal no existe como si es de otra
 * empresa (RNF-105): distinguirlos permitiria inferir que sucursales tiene un
 * competidor probando identificadores.
 */
export async function assertWorkshopInOrg(workshopId: string, orgId: string): Promise<void> {
  const { data, error } = await serviceClient()
    .from('workshops')
    .select('id, organization_id')
    .eq('id', workshopId)
    .maybeSingle();

  if (error) throw badRequest('workshop.lookup_failed', error.message);
  if (!data || (data as { organization_id: string }).organization_id !== orgId) {
    throw forbidden('workshop.access_denied', 'La sucursal no pertenece a la organizacion activa.');
  }
}
