import type { SupabaseClient } from '@supabase/supabase-js';
import { fromDb } from '../../lib/db.js';
import { internal } from '../../lib/errors.js';
import { getEnv } from '../../lib/env.js';
import { publicClient, serviceClient } from '../../lib/supabase.js';
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
 * Excepción 2 de ADR-008: el registro ocurre antes de que exista una sesión.
 *
 * DOS CAMINOS, Y POR QUÉ. La gestión de identidad —incluida la **confirmación
 * de correo**— se delega en el proveedor (ADR-004, RF-102):
 *
 *  · Con la confirmación activada (producción), el alta va por el flujo público
 *    del proveedor, que es el que **envía el correo**. Crearla con la API de
 *    administración dejaría la cuenta sin confirmar y sin aviso: nadie podría
 *    iniciar sesión, y el sistema no tiene por dónde enviar ese correo.
 *  · Con la confirmación desactivada (desarrollo, sin proveedor de correo), el
 *    alta va por la API de administración y la cuenta queda confirmada, que es
 *    lo que permite iniciar sesión de inmediato.
 *
 * En ambos casos la contraseña se entrega al proveedor y no se persiste en el
 * sistema (RNF-104).
 */
export const supabaseAccountGateway: AccountGateway = {
  async create(account) {
    // El disparador `mt_handle_new_user` crea el perfil a partir de estos datos.
    const perfil = { first_name: account.first_name, last_name: account.last_name };

    if (!getEnv().autoConfirmEmail) {
      const { data, error } = await publicClient().auth.signUp({
        email: account.email,
        password: account.password,
        options: { data: perfil },
      });

      if (error) {
        if (esCorreoTomado(error.message, (error as { code?: string }).code)) return 'email_taken';
        throw internal(`auth.signUp: ${error.message}`);
      }
      // Con la confirmación activada, el proveedor no distingue un correo ya
      // registrado para no ofrecer un mecanismo de enumeración: devuelve un
      // usuario sin identidades. Para la interfaz es el mismo caso.
      if (!data.user || (data.user.identities ?? []).length === 0) return 'email_taken';
      return { user_id: data.user.id };
    }

    const { data, error } = await serviceClient('registration').auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
      user_metadata: perfil,
    });

    if (error || !data.user) {
      if (error && esCorreoTomado(error.message, (error as { code?: string }).code)) return 'email_taken';
      throw internal(`auth.admin.createUser: ${error?.message ?? 'sin usuario devuelto'}`);
    }
    return { user_id: data.user.id };
  },

  async remove(userId) {
    const { error } = await serviceClient('registration').auth.admin.deleteUser(userId);
    if (error) throw internal(`auth.admin.deleteUser: ${error.message}`);
  },
};

/** El proveedor nombra de varias formas el mismo caso: el correo ya tiene cuenta. */
function esCorreoTomado(mensaje: string, code?: string): boolean {
  const texto = mensaje.toLowerCase();
  return (
    code === 'email_exists' ||
    code === 'user_already_exists' ||
    texto.includes('already been registered') ||
    texto.includes('already exists') ||
    texto.includes('already registered')
  );
}

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
