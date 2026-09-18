import { supabaseAccess, type AccessGateway } from './lib/access.js';
import { supabaseAuditRecorder, type AuditRecorder } from './lib/audit.js';
import { supabaseAccountGateway, type AccountGateway } from './modules/identity/identity.repository.js';
import {
  supabaseOrganizationFactory,
  type OrganizationFactory,
} from './modules/organizations/organizations.repository.js';

/**
 * Raíz de composición: las dependencias que la aplicación comparte entre
 * peticiones y que no dependen de la credencial de quien llama.
 *
 * Los repositorios de cada módulo se construyen por petición, con el cliente de
 * datos atado a la credencial (ADR-008). Lo que vive aquí es lo transversal: el
 * acceso —credencial, membresía, taller—, el alta de cuentas y de
 * organizaciones y la escritura de auditoría.
 *
 * `createApp` acepta sustituir cualquiera de estas piezas. Es lo que permite al
 * banco de pruebas anular la verificación de membresía (condición C2) o forzar
 * el fallo de un registro (CP-101.3) sin que el código de producción tenga
 * ningún interruptor para hacerlo.
 */
export interface Platform extends AccessGateway {
  accounts: AccountGateway;
  organizationFactory: OrganizationFactory;
  audit: AuditRecorder;
}

export const supabasePlatform: Platform = {
  ...supabaseAccess,
  accounts: supabaseAccountGateway,
  organizationFactory: supabaseOrganizationFactory,
  audit: supabaseAuditRecorder,
};
