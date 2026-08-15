import type { MiddlewareHandler } from 'hono';
import { requireMembership } from './memberships.js';
import { badRequest } from './errors.js';
import type { AppBindings, Role } from '../types.js';

/**
 * Contexto de organizacion activa para los modulos de negocio. Lee el header
 * `X-Org-Id`, valida la membership activa y deja orgId + orgRole en el
 * contexto (ADR-005).
 *
 * El servidor NUNCA asume una organizacion por defecto: si falta la cabecera,
 * la peticion se rechaza de forma explicita. Es el principio de valores por
 * defecto seguros aplicado al contexto de trabajo.
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
