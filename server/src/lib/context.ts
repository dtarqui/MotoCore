import type { Context, MiddlewareHandler } from 'hono';
import type { AccessGateway } from './access.js';
import { badRequest, forbidden, notFound } from './errors.js';
import { isUuid } from './http.js';
import type { OrgEnv, Role, WorkshopEnv } from '../types.js';

/**
 * Contexto activo (ADR-005): la organización llega en `X-Org-Id` y, en las
 * operaciones de nivel taller, el taller en `X-Workshop-Id`.
 *
 * Las reglas se aplican en el orden que fija el §2.2 del contrato:
 *
 *  1. Si falta una cabecera exigida, se rechaza. El servidor **nunca** elige
 *     una organización ni un taller por defecto.
 *  2. La organización se valida contra la membresía activa (RF-701).
 *  3. El taller se valida como perteneciente a la organización (RF-303).
 *  4. El rol lo evalúa cada servicio, según la operación.
 */

function header(c: Context, name: string): string {
  return c.req.header(name)?.trim() ?? '';
}

const missingOrg = () =>
  badRequest('organization.missing_active_org', 'Falta la organización activa (cabecera X-Org-Id).');
const missingWorkshop = () =>
  badRequest('workshop.missing_active_workshop', 'Falta el taller activo (cabecera X-Workshop-Id).');

/**
 * Rol del solicitante en la organización, exigiendo membresía activa.
 *
 * Es la capa de aplicación del aislamiento (ADR-002). Un identificador mal
 * formado, uno inexistente y uno sin membresía responden igual: el solicitante
 * declaró operar sobre esa organización, y negarle el acceso no revela nada
 * que él no haya afirmado (§5 del contrato).
 */
export async function requireMembership(access: AccessGateway, orgId: string, userId: string): Promise<Role> {
  const membership = isUuid(orgId) ? await access.findMembership(orgId, userId) : null;
  if (!membership?.is_active) {
    throw forbidden('organization.access_denied', 'No tienes acceso a esta organización.');
  }
  return membership.role;
}

/**
 * Un taller de otra organización responde `404 workshop.not_found`, igual que
 * uno inexistente (RNF-105): un `403` confirmaría que ese identificador existe
 * en alguna parte, y bastaría para enumerar los talleres de un competidor.
 */
async function requireWorkshopInOrg(access: AccessGateway, workshopId: string, orgId: string): Promise<void> {
  const owner = isUuid(workshopId) ? await access.findWorkshopOrganization(workshopId) : null;
  if (owner !== orgId) {
    throw notFound('workshop.not_found', 'Taller no encontrado.');
  }
}

/** Operaciones sobre datos de una organización: exige `X-Org-Id`. */
export function requireOrgContext(access: AccessGateway): MiddlewareHandler<OrgEnv> {
  return async (c, next) => {
    const orgId = header(c, 'X-Org-Id');
    if (!orgId) throw missingOrg();

    const userId = c.get('identity').userId;
    const role = await requireMembership(access, orgId, userId);
    c.set('ctx', { userId, orgId, role });
    await next();
  };
}

/** Operaciones de nivel taller: exige además `X-Workshop-Id`, de la organización activa. */
export function requireWorkshopContext(access: AccessGateway): MiddlewareHandler<WorkshopEnv> {
  return async (c, next) => {
    const orgId = header(c, 'X-Org-Id');
    const workshopId = header(c, 'X-Workshop-Id');
    // Regla 1 completa antes de consultar nada: la ausencia de cualquiera de
    // las dos cabeceras se rechaza sin tocar la base.
    if (!orgId) throw missingOrg();
    if (!workshopId) throw missingWorkshop();

    const userId = c.get('identity').userId;
    const role = await requireMembership(access, orgId, userId);
    await requireWorkshopInOrg(access, workshopId, orgId);
    c.set('ctx', { userId, orgId, role, workshopId });
    await next();
  };
}
