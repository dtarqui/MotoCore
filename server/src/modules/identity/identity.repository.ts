import type { SupabaseClient } from '@supabase/supabase-js';
import { fromDb } from '../../lib/db.js';
import { internal } from '../../lib/errors.js';
import { getEnv } from '../../lib/env.js';
import { serviceClient } from '../../lib/supabase.js';
import type { Role } from '../../types.js';
import {
  ORGANIZATION_COLUMNS,
  type OrganizationMembership,
  type OrganizationRow,
} from '../organizations/organizations.repository.js';

export interface ProfileRow {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export interface NewAccount {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

/**
 * Alta y baja de cuentas en el proveedor de identidad (ADR-004). El sistema no
 * guarda la contraseña: la entrega al proveedor y la olvida (RNF-104).
 */
export interface AccountGateway {
  /** Devuelve `'email_taken'` si el correo ya tiene cuenta. */
  create(account: NewAccount): Promise<{ user_id: string } | 'email_taken'>;
  remove(userId: string): Promise<void>;
}

export interface ProfileRepository {
  findProfile(userId: string): Promise<ProfileRow | null>;
  /** Organizaciones donde la cuenta tiene membresía **activa**, con su rol (RF-104). */
  listOrganizations(userId: string): Promise<OrganizationMembership[]>;
}

/**
 * Excepción 2 de ADR-008: el registro ocurre antes de que exista una sesión, y
 * solo la API de administración del proveedor crea cuentas.
 */
export const supabaseAccountGateway: AccountGateway = {
  async create(account) {
    const { data, error } = await serviceClient('registration').auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: getEnv().autoConfirmEmail,
      // El disparador `mt_handle_new_user` crea el perfil a partir de estos datos.
      user_metadata: { first_name: account.first_name, last_name: account.last_name },
    });

    if (error || !data.user) {
      const code = (error as { code?: string } | null)?.code;
      const message = (error?.message ?? '').toLowerCase();
      if (
        code === 'email_exists' ||
        message.includes('already been registered') ||
        message.includes('already exists')
      ) {
        return 'email_taken';
      }
      throw internal(`auth.admin.createUser: ${error?.message ?? 'sin usuario devuelto'}`);
    }
    return { user_id: data.user.id };
  },

  async remove(userId) {
    const { error } = await serviceClient('registration').auth.admin.deleteUser(userId);
    if (error) throw internal(`auth.admin.deleteUser: ${error.message}`);
  },
};

export function supabaseProfileRepository(db: SupabaseClient): ProfileRepository {
  return {
    async findProfile(userId) {
      const { data, error } = await db
        .from('mt_profiles')
        .select('id, email, first_name, last_name')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw fromDb('profiles.select', error);
      return (data as ProfileRow | null) ?? null;
    },

    async listOrganizations(userId) {
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
  };
}
