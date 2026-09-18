import type { AuditRecorder } from '../../lib/audit.js';
import { UniqueViolation } from '../../lib/db.js';
import { conflict, forbidden, notFound } from '../../lib/errors.js';
import { isUuid } from '../../lib/http.js';
import { parseBody } from '../../lib/validation.js';
import type { OrgContext, Role } from '../../types.js';
import type { ClientRow, ClientsRepository } from './clients.repository.js';
import { createClientSchema, updateClientSchema } from './clients.schemas.js';

export interface ClientsDeps {
  repo: ClientsRepository;
  audit: AuditRecorder;
}

/** RF-505: el Mechanic consulta clientes, pero no los crea ni los modifica. */
const WRITE_ROLES: readonly Role[] = ['owner', 'receptionist'];

function assertCanWrite(ctx: OrgContext): void {
  if (!WRITE_ROLES.includes(ctx.role)) {
    throw forbidden('client.insufficient_permissions', 'Tu rol no permite modificar clientes.');
  }
}

/** Un cliente de otra organización responde igual que uno inexistente (RNF-105). */
const clientNotFound = () => notFound('client.not_found', 'Cliente no encontrado.');
const duplicateEmail = () =>
  conflict('client.duplicate_email', 'Ya existe un cliente con ese correo en la organización.');

function translateUnique(error: unknown): never {
  if (error instanceof UniqueViolation) throw duplicateEmail();
  throw error;
}

/**
 * Clientes — entidad de **nivel organización** (RF-501 a RF-505).
 *
 * Nada en este servicio mira el taller activo, y esa ausencia es la evidencia
 * de RF-502: un cliente registrado operando desde un taller se ve igual desde
 * cualquier otro de la misma organización.
 */
export function createClientsService({ repo, audit }: ClientsDeps) {
  async function load(ctx: OrgContext, clientId: string): Promise<ClientRow> {
    const client = isUuid(clientId) ? await repo.findById(ctx.orgId, clientId) : null;
    if (!client) throw clientNotFound();
    return client;
  }

  return {
    /** RF-502 y RF-504: la búsqueda nunca sale de la organización activa. */
    list(ctx: OrgContext, options: { search?: string; includeInactive: boolean }): Promise<ClientRow[]> {
      const search = options.search?.trim() || undefined;
      return repo.list(ctx.orgId, { search, includeInactive: options.includeInactive });
    },

    get: load,

    /** RF-501, RF-503: el correo es único por organización (RN-07). */
    async create(ctx: OrgContext, body: unknown): Promise<ClientRow> {
      assertCanWrite(ctx);
      const input = parseBody(createClientSchema, body);
      try {
        return await repo.insert({
          organization_id: ctx.orgId,
          first_name: input.first_name,
          last_name: input.last_name,
          email: input.email ?? null,
          phone: input.phone ?? null,
          document_id: input.document_id ?? null,
          address: input.address ?? null,
          notes: input.notes ?? null,
        });
      } catch (error) {
        return translateUnique(error);
      }
    },

    /** RF-504: datos de contacto. */
    async update(ctx: OrgContext, clientId: string, body: unknown): Promise<ClientRow> {
      assertCanWrite(ctx);
      const input = parseBody(updateClientSchema, body);
      await load(ctx, clientId);
      try {
        const client = await repo.update(ctx.orgId, clientId, { ...input, updated_at: new Date().toISOString() });
        if (!client) throw clientNotFound();
        return client;
      } catch (error) {
        return translateUnique(error);
      }
    },

    /**
     * RF-504: baja lógica, el registro se conserva (RN-14). Acción auditada
     * (RF-703). Dar de baja a quien ya lo está no es una transición y no se
     * registra dos veces.
     */
    async deactivate(ctx: OrgContext, clientId: string): Promise<ClientRow> {
      assertCanWrite(ctx);
      const current = await load(ctx, clientId);
      if (!current.is_active) return current;

      const client = await repo.update(ctx.orgId, clientId, {
        is_active: false,
        updated_at: new Date().toISOString(),
      });
      if (!client) throw clientNotFound();

      await audit.record({
        organizationId: ctx.orgId,
        performedBy: ctx.userId,
        action: 'client.deactivated',
        entity: 'client',
        entityId: clientId,
      });
      return client;
    },
  };
}
