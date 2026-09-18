import { AppError, conflict } from '../../lib/errors.js';
import { parseBody } from '../../lib/validation.js';
import type { Identity } from '../../types.js';
import type {
  OrganizationFactory,
  OrganizationMembership,
  OrganizationRow,
} from '../organizations/organizations.repository.js';
import type { WorkshopRow } from '../workshops/workshops.repository.js';
import type { AccountGateway, ProfileRepository, ProfileRow } from './identity.repository.js';
import { registerSchema } from './identity.schemas.js';

export interface RegistrationDeps {
  accounts: AccountGateway;
  organizations: OrganizationFactory;
}

export interface ProfileDeps {
  profiles: ProfileRepository;
}

export interface Registration {
  user_id: string;
  organization: OrganizationRow;
  workshop: WorkshopRow | null;
}

/**
 * `auth.registration_failed` (500): el registro se interrumpió y no dejó nada
 * aplicado. La causa se registra en el servidor, no se devuelve.
 */
function registrationFailed(cause: unknown): AppError {
  const detail = cause instanceof AppError ? (cause.internalCause ?? cause.message) : String(cause);
  return new AppError(
    'auth.registration_failed',
    'No se pudo completar el registro. No se creó ninguna cuenta.',
    500,
    detail,
  );
}

/**
 * Registro — RF-101, RN-16.
 *
 * La cuenta, la organización, el primer taller y la membresía propietaria se
 * crean **en un solo acto**. Los tres últimos ocurren en una transacción del
 * motor (ADR-007); la cuenta vive en el proveedor de identidad, fuera de esa
 * transacción, así que si la transacción falla se elimina la cuenta: de cara al
 * cliente, el registro ocurre entero o no ocurre.
 *
 * El inicio de sesión NO pasa por aquí: el cliente lo hace contra el proveedor
 * y esta interfaz solo verifica la credencial resultante (ADR-004).
 */
export function createRegistrationService({ accounts, organizations }: RegistrationDeps) {
  return {
    async register(body: unknown): Promise<Registration> {
      const input = parseBody(registerSchema, body);

      let account: { user_id: string } | 'email_taken';
      try {
        account = await accounts.create({
          email: input.email,
          password: input.password,
          first_name: input.first_name,
          last_name: input.last_name,
        });
      } catch (error) {
        throw registrationFailed(error);
      }
      if (account === 'email_taken') {
        throw conflict('auth.email_already_registered', 'Ya existe una cuenta con ese correo.');
      }

      try {
        const { organization, workshop } = await organizations.create({
          owner_id: account.user_id,
          name: input.organization_name,
          workshop_name: input.workshop_name ?? input.organization_name,
        });
        return { user_id: account.user_id, organization, workshop };
      } catch (error) {
        // La transacción del motor no dejó nada; queda revertir la cuenta.
        await accounts.remove(account.user_id).catch(() => undefined);
        throw registrationFailed(error);
      }
    },
  };
}

/** Perfil de la cuenta autenticada y sus organizaciones con rol — RF-104, RF-202. */
export function createProfileService({ profiles }: ProfileDeps) {
  return {
    async me(identity: Identity): Promise<{
      user_id: string;
      email: string;
      profile: ProfileRow | null;
      organizations: OrganizationMembership[];
    }> {
      const [profile, organizations] = await Promise.all([
        profiles.findProfile(identity.userId),
        profiles.listOrganizations(identity.userId),
      ]);
      return { user_id: identity.userId, email: identity.email, profile, organizations };
    },
  };
}
