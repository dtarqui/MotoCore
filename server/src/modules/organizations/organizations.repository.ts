import type { SupabaseClient } from '@supabase/supabase-js';
import { fromDb } from '../../lib/db.js';
import { internal } from '../../lib/errors.js';
import { serviceClient } from '../../lib/supabase.js';
import type { Role } from '../../types.js';
import type { WorkshopRow } from '../workshops/workshops.repository.js';

export interface OrganizationRow {
  id: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string | null;
  owner_id: string;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
}

export interface OrganizationMembership {
  role: Role;
  organization: OrganizationRow;
}

export type OrganizationPatch = Partial<
  Pick<OrganizationRow, 'name' | 'description' | 'address' | 'phone' | 'email'>
> & { updated_at: string };

/** Acceso a las organizaciones con la credencial de la petición. */
export interface OrganizationsRepository {
  /** Organizaciones donde la cuenta tiene membresía **activa**, con su rol (RF-202). */
  listForUser(userId: string): Promise<OrganizationMembership[]>;
  findById(orgId: string): Promise<OrganizationRow | null>;
  update(orgId: string, patch: OrganizationPatch): Promise<OrganizationRow | null>;
}

export interface NewOrganization {
  owner_id: string;
  name: string;
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  /** Solo el registro crea el primer taller (HU-01); RF-201 no lo hace. */
  workshop_name?: string | null;
}

/** Creación atómica de una organización con su membresía propietaria (ADR-007). */
export interface OrganizationFactory {
  create(input: NewOrganization): Promise<{ organization: OrganizationRow; workshop: WorkshopRow | null }>;
}

export const ORGANIZATION_COLUMNS =
  'id, name, description, address, phone, email, owner_id, is_active, created_at, updated_at';

export function supabaseOrganizationsRepository(db: SupabaseClient): OrganizationsRepository {
  return {
    async listForUser(userId) {
      const { data, error } = await db
        .from('mt_memberships')
        .select(`role, organization:mt_organizations ( ${ORGANIZATION_COLUMNS} )`)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (error) throw fromDb('memberships.select', error);
      return ((data ?? []) as unknown as Array<{ role: Role; organization: OrganizationRow | null }>)
        .filter((m): m is OrganizationMembership => m.organization !== null)
        .sort((a, b) => a.organization.name.localeCompare(b.organization.name, 'es'));
    },

    async findById(orgId) {
      const { data, error } = await db
        .from('mt_organizations')
        .select(ORGANIZATION_COLUMNS)
        .eq('id', orgId)
        .maybeSingle();

      if (error) throw fromDb('organizations.select', error);
      return (data as OrganizationRow | null) ?? null;
    },

    async update(orgId, patch) {
      const { data, error } = await db
        .from('mt_organizations')
        .update(patch)
        .eq('id', orgId)
        .select(ORGANIZATION_COLUMNS)
        .maybeSingle();

      if (error) throw fromDb('organizations.update', error);
      return (data as OrganizationRow | null) ?? null;
    },
  };
}

/**
 * Excepción 3 de ADR-008. La organización y su membresía propietaria nacen en
 * una sola transacción, dentro de `mt_create_organization`: ninguna política
 * puede autorizar esa primera membresía, porque el solicitante todavía no es
 * miembro. Lo recién creado se lee con la misma credencial, porque en el
 * registro aún no existe una sesión con la que leerlo.
 */
export const supabaseOrganizationFactory: OrganizationFactory = {
  async create(input) {
    const db = serviceClient('organization-creation');

    const { data, error } = await db.rpc('mt_create_organization', {
      p_owner_id: input.owner_id,
      p_name: input.name,
      p_workshop_name: input.workshop_name ?? null,
      p_description: input.description ?? null,
      p_address: input.address ?? null,
      p_phone: input.phone ?? null,
      p_email: input.email ?? null,
    });
    if (error) throw internal(`mt_create_organization: ${error.message}`);

    const created = (Array.isArray(data) ? data[0] : data) as
      { organization_id: string; workshop_id: string | null } | undefined;
    if (!created) throw internal('mt_create_organization: sin fila devuelta');

    const { data: organization, error: orgErr } = await db
      .from('mt_organizations')
      .select(ORGANIZATION_COLUMNS)
      .eq('id', created.organization_id)
      .single();
    if (orgErr) throw internal(`organizations.select: ${orgErr.message}`);

    let workshop: WorkshopRow | null = null;
    if (created.workshop_id) {
      const { data: ws, error: wsErr } = await db
        .from('mt_workshops')
        .select('id, organization_id, name, address, phone, is_active, created_at, updated_at')
        .eq('id', created.workshop_id)
        .single();
      if (wsErr) throw internal(`workshops.select: ${wsErr.message}`);
      workshop = ws as WorkshopRow;
    }

    return { organization: organization as OrganizationRow, workshop };
  },
};
