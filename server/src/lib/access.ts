import type { SupabaseClient } from '@supabase/supabase-js';
import { internal } from './errors.js';
import { publicClient, serviceClient, userClient } from './supabase.js';
import type { Identity, Role } from '../types.js';

export interface MembershipState {
  role: Role;
  is_active: boolean;
}

/**
 * Lo que los middlewares necesitan para decidir si una petición entra: verificar
 * la credencial, construir el cliente de datos de la petición y comprobar la
 * membresía y la pertenencia del taller.
 *
 * Es una interfaz, y no llamadas directas al proveedor, por dos motivos. El
 * primero es que la capa de aplicación del aislamiento queda **sustituible en
 * el banco de pruebas**: la condición C2 (CP-N102) reemplaza `findMembership`
 * por una versión que concede sin comprobar, sin que exista en producción
 * ningún interruptor que la apague. El segundo es que las pruebas de contrato
 * (N2) ejercen la interfaz completa sin base de datos.
 */
export interface AccessGateway {
  /** Identidad de la credencial, o `null` si es inválida, expirada o revocada. */
  verifyToken(token: string): Promise<Identity | null>;
  /** Cliente de datos atado a la credencial: el que respeta RLS. */
  requestClient(token: string): SupabaseClient;
  /** Membresía de la cuenta en la organización, activa o no. Capa de aplicación del aislamiento. */
  findMembership(orgId: string, userId: string): Promise<MembershipState | null>;
  /** Organización a la que pertenece el taller, o `null` si no existe. */
  findWorkshopOrganization(workshopId: string): Promise<string | null>;
}

export const supabaseAccess: AccessGateway = {
  async verifyToken(token) {
    // Se consulta al proveedor en lugar de comprobar la firma localmente: así
    // una sesión revocada deja de valer de inmediato (ADR-004).
    const { data, error } = await publicClient().auth.getUser(token);
    if (error || !data.user) return null;
    return { userId: data.user.id, email: data.user.email ?? '' };
  },

  requestClient: userClient,

  async findMembership(orgId, userId) {
    // Excepción 1: si esta consulta dependiera de RLS, la capa de aplicación
    // dependería de la del motor y ambas dejarían de ser independientes.
    const { data, error } = await serviceClient('membership-verification')
      .from('mt_memberships')
      .select('role, is_active')
      .eq('organization_id', orgId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw internal(`memberships.select: ${error.message}`);
    return (data as MembershipState | null) ?? null;
  },

  async findWorkshopOrganization(workshopId) {
    const { data, error } = await serviceClient('membership-verification')
      .from('mt_workshops')
      .select('organization_id')
      .eq('id', workshopId)
      .maybeSingle();

    if (error) throw internal(`workshops.select: ${error.message}`);
    return (data as { organization_id: string } | null)?.organization_id ?? null;
  },
};
