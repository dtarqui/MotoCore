import { serviceClient } from './supabase.js';
import { forbidden, badRequest } from './errors.js';
import type { Membership, Role } from '../types.js';

/** Lee la membership (si existe) de un usuario en una organizacion. */
export async function getMembership(orgId: string, userId: string): Promise<Membership | null> {
  const { data, error } = await serviceClient()
    .from('memberships')
    .select('organization_id, user_id, role, is_active')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw badRequest('membership.lookup_failed', error.message);
  return (data as Membership | null) ?? null;
}

/**
 * Exige que el usuario sea miembro activo de la organizacion. Es la capa de
 * aplicacion del aislamiento multi-tenant (ADR-002): se ejecuta al inicio de
 * cada handler, por encima de las politicas RLS. Devuelve su rol.
 */
export async function requireMembership(orgId: string, userId: string): Promise<Role> {
  const membership = await getMembership(orgId, userId);
  if (!membership || !membership.is_active) {
    throw forbidden('organization.access_denied', 'No tienes acceso a esta organizacion.');
  }
  return membership.role;
}

/** Exige que el usuario sea Owner de la organizacion. */
export async function requireOwner(orgId: string, userId: string): Promise<void> {
  const role = await requireMembership(orgId, userId);
  if (role !== 'owner') {
    throw forbidden('organization.insufficient_permissions', 'Solo el Owner puede realizar esta accion.');
  }
}

/**
 * Exige que el rol del usuario en la organizacion sea uno de los admitidos.
 * El rol es por organizacion, nunca por sucursal: la asignacion a sucursales
 * es operativa y no altera permisos (ADR-006).
 */
export async function requireRole(orgId: string, userId: string, roles: readonly Role[]): Promise<Role> {
  const role = await requireMembership(orgId, userId);
  if (!roles.includes(role)) {
    throw forbidden('organization.insufficient_permissions', 'Tu rol no permite realizar esta accion.');
  }
  return role;
}
