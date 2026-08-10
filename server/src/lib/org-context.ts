import type { MiddlewareHandler } from 'hono';
import { requireMembership } from './memberships.js';
import { badRequest } from './errors.js';
import type { AppBindings, Role } from '../types.js';

/**
 * Contexto de organizacion activa para modulos de negocio (clients, motos,
 * ordenes, etc. — se portan en iteraciones siguientes). Lee el header
 * `X-Org-Id`, valida la membership activa y deja orgId + orgRole en el
 * contexto. Es el equivalente al GetFirstWorkshopId del .NET, pero con
 * seleccion explicita de organizacion (estilo ERP multiempresa).
 */
export type OrgBindings = { Variables: AppBindings['Variables'] & { orgId: string; orgRole: Role } };

export const requireActiveOrg: MiddlewareHandler<OrgBindings> = async (c, next) => {
  const orgId = c.req.header('X-Org-Id')?.trim() ?? '';
  if (!orgId) {
    throw badRequest('organization.missing_active_org', 'Falta la organizacion activa (header X-Org-Id).');
  }
  const role = await requireMembership(orgId, c.get('userId'));
  c.set('orgId', orgId);
  c.set('orgRole', role);
  await next();
};
