import type { SupabaseClient } from '@supabase/supabase-js';
import { fromDb } from '../../lib/db.js';
import { internal } from '../../lib/errors.js';
import { serviceClient } from '../../lib/supabase.js';
import type { Role } from '../../types.js';

/** Miembro de la organización tal como lo expone el listado (RF-407): membresía y datos de perfil. */
export interface MemberRow {
  user_id: string;
  role: Role;
  is_active: boolean;
  joined_at: string;
  updated_at: string | null;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
}

export interface MembersRepository {
  list(orgId: string, options: { includeInactive: boolean }): Promise<MemberRow[]>;
  findMember(orgId: string, userId: string): Promise<MemberRow | null>;
  /** Cuenta con ese correo. Solo el servidor puede buscarla (RNF-106). */
  findAccountIdByEmail(email: string): Promise<string | null>;
  findOwnerId(orgId: string): Promise<string | null>;
  insert(orgId: string, userId: string, role: Role): Promise<void>;
  update(orgId: string, userId: string, patch: { role?: Role; is_active?: boolean }): Promise<void>;
}

interface MembershipFields {
  user_id: string;
  role: Role;
  is_active: boolean;
  joined_at: string;
  updated_at: string | null;
}

export function supabaseMembersRepository(db: SupabaseClient): MembersRepository {
  /**
   * Excepción 4 de ADR-008: la política de `mt_profiles` solo deja leer el
   * perfil propio. Los de los demás se leen con privilegio, y únicamente para
   * cuentas que ya se obtuvieron como miembros de la organización activa con la
   * credencial de la petición.
   */
  async function withProfiles(memberships: MembershipFields[]): Promise<MemberRow[]> {
    if (memberships.length === 0) return [];

    const { data, error } = await serviceClient('member-profiles')
      .from('mt_profiles')
      .select('id, email, first_name, last_name')
      .in(
        'id',
        memberships.map((m) => m.user_id),
      );
    if (error) throw internal(`profiles.select: ${error.message}`);

    const profiles = new Map(
      ((data ?? []) as Array<{ id: string; email: string; first_name: string; last_name: string }>).map((p) => [
        p.id,
        p,
      ]),
    );

    return memberships.map((m) => {
      const profile = profiles.get(m.user_id);
      return {
        ...m,
        email: profile?.email ?? null,
        first_name: profile?.first_name ?? null,
        last_name: profile?.last_name ?? null,
      };
    });
  }

  const MEMBERSHIP_COLUMNS = 'user_id, role, is_active, joined_at, updated_at';

  return {
    async list(orgId, { includeInactive }) {
      let query = db.from('mt_memberships').select(MEMBERSHIP_COLUMNS).eq('organization_id', orgId);
      if (!includeInactive) query = query.eq('is_active', true);

      const { data, error } = await query.order('joined_at');
      if (error) throw fromDb('memberships.select', error);
      return withProfiles((data ?? []) as MembershipFields[]);
    },

    async findMember(orgId, userId) {
      const { data, error } = await db
        .from('mt_memberships')
        .select(MEMBERSHIP_COLUMNS)
        .eq('organization_id', orgId)
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw fromDb('memberships.select', error);
      if (!data) return null;
      const [member] = await withProfiles([data as MembershipFields]);
      return member ?? null;
    },

    async findAccountIdByEmail(email) {
      // Excepción 5: la función está concedida solo a la identidad del servidor.
      const { data, error } = await serviceClient('account-lookup').rpc('mt_get_user_id_by_email', {
        p_email: email,
      });
      if (error) throw internal(`mt_get_user_id_by_email: ${error.message}`);
      return (data as string | null) ?? null;
    },

    async findOwnerId(orgId) {
      const { data, error } = await db.from('mt_organizations').select('owner_id').eq('id', orgId).maybeSingle();
      if (error) throw fromDb('organizations.select', error);
      return (data as { owner_id: string } | null)?.owner_id ?? null;
    },

    async insert(orgId, userId, role) {
      const { error } = await db.from('mt_memberships').insert({ organization_id: orgId, user_id: userId, role });
      if (error) throw fromDb('memberships.insert', error);
    },

    async update(orgId, userId, patch) {
      const { error } = await db
        .from('mt_memberships')
        .update({ ...patch, updated_at: new Date().toISOString() })
        .eq('organization_id', orgId)
        .eq('user_id', userId);
      if (error) throw fromDb('memberships.update', error);
    },
  };
}
