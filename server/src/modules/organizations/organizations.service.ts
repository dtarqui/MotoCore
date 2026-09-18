import type { AuditRecorder } from '../../lib/audit.js';
import { forbidden, notFound } from '../../lib/errors.js';
import { parseBody } from '../../lib/validation.js';
import type { Role } from '../../types.js';
import type {
  OrganizationFactory,
  OrganizationMembership,
  OrganizationRow,
  OrganizationsRepository,
} from './organizations.repository.js';
import { createOrganizationSchema, updateOrganizationSchema } from './organizations.schemas.js';

/** Rol del solicitante en la organización; lanza `403 organization.access_denied` sin membresía activa. */
export type MembershipCheck = (orgId: string, userId: string) => Promise<Role>;

export interface OrganizationsDeps {
  repo: OrganizationsRepository;
  factory: OrganizationFactory;
  membership: MembershipCheck;
  audit: AuditRecorder;
}

const organizationNotFound = () => notFound('organization.not_found', 'Organización no encontrada.');

/**
 * Organizaciones de la cuenta — RF-201 a RF-204.
 *
 * Es el único módulo cuyo identificador de organización viaja en la ruta, y la
 * razón la fija el §2.3 del contrato: aquí la organización es el recurso, no el
 * contexto. Por eso la membresía se comprueba aquí y no en el middleware de
 * contexto activo.
 */
export function createOrganizationsService({ repo, factory, membership, audit }: OrganizationsDeps) {
  async function load(orgId: string): Promise<OrganizationRow> {
    const organization = await repo.findById(orgId);
    if (!organization) throw organizationNotFound();
    return organization;
  }

  return {
    /** RF-202: según la membresía activa, no según quién la creó. */
    list(userId: string): Promise<OrganizationMembership[]> {
      return repo.listForUser(userId);
    },

    /** RF-201: el solicitante queda como Owner. El propietario sale de la credencial, nunca del cuerpo. */
    async create(userId: string, body: unknown): Promise<OrganizationRow> {
      const input = parseBody(createOrganizationSchema, body);
      const { organization } = await factory.create({ ...input, owner_id: userId });
      return organization;
    },

    async get(userId: string, orgId: string): Promise<OrganizationRow> {
      await membership(orgId, userId);
      return load(orgId);
    },

    /**
     * RF-203. No cambia estado en el servidor —no hay sesión que actualizar—:
     * **valida** que la cuenta pueda operar sobre la organización y devuelve su
     * rol, para que el cliente guarde el contexto y lo envíe en `X-Org-Id`.
     */
    async switchTo(userId: string, orgId: string): Promise<{ organization: OrganizationRow; role: Role }> {
      const role = await membership(orgId, userId);
      return { organization: await load(orgId), role };
    },

    /** RF-204, solo Owner. Acción auditada (RF-703). */
    async update(userId: string, orgId: string, body: unknown): Promise<OrganizationRow> {
      const role = await membership(orgId, userId);
      if (role !== 'owner') {
        throw forbidden('organization.insufficient_permissions', 'Solo el Owner puede editar la organización.');
      }
      const input = parseBody(updateOrganizationSchema, body);

      const organization = await repo.update(orgId, { ...input, updated_at: new Date().toISOString() });
      if (!organization) throw organizationNotFound();

      await audit.record({
        organizationId: orgId,
        performedBy: userId,
        action: 'organization.updated',
        entity: 'organization',
        entityId: orgId,
        details: { fields: Object.keys(input).filter((k) => input[k as keyof typeof input] !== undefined) },
      });
      return organization;
    },
  };
}
