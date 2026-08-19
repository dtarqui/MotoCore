import { serviceClient } from './supabase.js';
import { forbidden, internal } from './errors.js';
import type { Membership, Role } from '../types.js';

/** Lee la membresia (si existe) de una cuenta en una organizacion. */
export async function getMembership(orgId: string, userId: string): Promise<Membership | null> {
  const { data, error } = await serviceClient()
    .from('memberships')
    .select('organization_id, user_id, role, is_active')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw internal(`memberships.select: ${error.message}`);
  return (data as Membership | null) ?? null;
}

/**
 * Exige que la cuenta sea miembro activo de la organizacion. Es la capa de
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

/**
 * Exige que la cuenta sea Owner de la organizacion.
 *
 * `modulo` selecciona el codigo `<modulo>.insufficient_permissions` que fija el
 * §4 del contrato: la respuesta nombra el modulo sobre el que se denego la
 * operacion, no el generico de organizacion.
 */
export async function requireOwner(
  orgId: string,
  userId: string,
  modulo: 'organization' | 'workshop' | 'member' | 'inventory' = 'organization',
): Promise<void> {
  const role = await requireMembership(orgId, userId);
  if (role !== 'owner') {
    throw forbidden(`${modulo}.insufficient_permissions`, 'Solo el Owner puede realizar esta accion.');
  }
}

/**
 * Exige que el rol de la cuenta en la organizacion sea uno de los admitidos.
 * El rol es por organizacion, nunca por taller: la asignacion a talleres es
 * operativa y no altera permisos (ADR-006).
 */
export async function requireRole(
  orgId: string,
  userId: string,
  roles: readonly Role[],
  modulo: 'organization' | 'workshop' | 'member' | 'inventory' = 'organization',
): Promise<Role> {
  const role = await requireMembership(orgId, userId);
  if (!roles.includes(role)) {
    throw forbidden(`${modulo}.insufficient_permissions`, 'Tu rol no permite realizar esta accion.');
  }
  return role;
}
