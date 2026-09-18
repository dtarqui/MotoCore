import type { AuditRecorder } from '../../lib/audit.js';
import { UniqueViolation } from '../../lib/db.js';
import { conflict, forbidden, notFound } from '../../lib/errors.js';
import { isUuid } from '../../lib/http.js';
import { parseBody } from '../../lib/validation.js';
import type { OrgContext } from '../../types.js';
import type { AssignmentRow, WorkshopRow, WorkshopsRepository } from './workshops.repository.js';
import { assignMemberSchema, createWorkshopSchema, updateWorkshopSchema } from './workshops.schemas.js';

export interface WorkshopsDeps {
  repo: WorkshopsRepository;
  audit: AuditRecorder;
}

const workshopNotFound = () => notFound('workshop.not_found', 'Taller no encontrado.');
const memberNotFound = () => notFound('member.not_found', 'La cuenta no es miembro de esta organización.');
const duplicateName = () =>
  conflict('workshop.duplicate_name', 'Ya existe un taller con ese nombre en la organización.');

/** Solo el Owner administra talleres y asignaciones (RF-301, RF-304, RF-305). */
function assertOwner(ctx: OrgContext): void {
  if (ctx.role !== 'owner') {
    throw forbidden('workshop.insufficient_permissions', 'Solo el Owner puede administrar talleres.');
  }
}

/**
 * Talleres de la organización activa — RF-301 a RF-305.
 *
 * Cualquier miembro los lee: el taller no es frontera de seguridad (ADR-006).
 * Solo el Owner los administra. La asignación de miembros es **operativa**: no
 * otorga ni restringe lo que el miembro puede ver.
 */
export function createWorkshopsService({ repo, audit }: WorkshopsDeps) {
  /** Un taller de otra organización se trata como inexistente (RNF-105). */
  async function load(ctx: OrgContext, workshopId: string): Promise<WorkshopRow> {
    const workshop = isUuid(workshopId) ? await repo.findById(ctx.orgId, workshopId) : null;
    if (!workshop) throw workshopNotFound();
    return workshop;
  }

  return {
    /** RF-302 y RF-305: por omisión, solo los activos. */
    list(ctx: OrgContext, options: { includeInactive: boolean }): Promise<WorkshopRow[]> {
      return repo.list(ctx.orgId, options);
    },

    get: load,

    /** RF-301. El nombre es único por organización (RN-06). */
    async create(ctx: OrgContext, body: unknown): Promise<WorkshopRow> {
      assertOwner(ctx);
      const input = parseBody(createWorkshopSchema, body);
      try {
        return await repo.insert({
          organization_id: ctx.orgId,
          name: input.name,
          address: input.address ?? null,
          phone: input.phone ?? null,
        });
      } catch (error) {
        if (error instanceof UniqueViolation) throw duplicateName();
        throw error;
      }
    },

    async update(ctx: OrgContext, workshopId: string, body: unknown): Promise<WorkshopRow> {
      assertOwner(ctx);
      const input = parseBody(updateWorkshopSchema, body);
      await load(ctx, workshopId);
      try {
        const workshop = await repo.update(ctx.orgId, workshopId, { ...input, updated_at: new Date().toISOString() });
        if (!workshop) throw workshopNotFound();
        return workshop;
      } catch (error) {
        if (error instanceof UniqueViolation) throw duplicateName();
        throw error;
      }
    },

    /**
     * RF-305: baja lógica que conserva el historial. Acción auditada (RF-703).
     * Desactivar un taller ya inactivo no es una transición, y no se registra
     * dos veces.
     */
    async deactivate(ctx: OrgContext, workshopId: string): Promise<WorkshopRow> {
      assertOwner(ctx);
      const current = await load(ctx, workshopId);
      if (!current.is_active) return current;

      const workshop = await repo.update(ctx.orgId, workshopId, {
        is_active: false,
        updated_at: new Date().toISOString(),
      });
      if (!workshop) throw workshopNotFound();

      await audit.record({
        organizationId: ctx.orgId,
        workshopId,
        performedBy: ctx.userId,
        action: 'workshop.deactivated',
        entity: 'workshop',
        entityId: workshopId,
      });
      return workshop;
    },

    async listAssignments(ctx: OrgContext, workshopId: string): Promise<AssignmentRow[]> {
      await load(ctx, workshopId);
      return repo.listAssignments(ctx.orgId, workshopId);
    },

    /**
     * RF-304. Asignar a quien ya está asignado no duplica ni falla: la
     * operación es idempotente, y `created` distingue ambos casos.
     */
    async assign(
      ctx: OrgContext,
      workshopId: string,
      body: unknown,
    ): Promise<{ assignment: AssignmentRow; created: boolean }> {
      assertOwner(ctx);
      const { user_id: userId } = parseBody(assignMemberSchema, body);
      await load(ctx, workshopId);

      const membership = await repo.findMembership(ctx.orgId, userId);
      if (!membership?.is_active) throw memberNotFound();

      const existing = await repo.findAssignment(ctx.orgId, workshopId, userId);
      if (existing) return { assignment: existing, created: false };

      let created = true;
      try {
        await repo.insertAssignment(ctx.orgId, workshopId, membership.id);
      } catch (error) {
        // Una asignación simultánea ganó la carrera: el resultado es el mismo.
        if (!(error instanceof UniqueViolation)) throw error;
        created = false;
      }
      const assignment = await repo.findAssignment(ctx.orgId, workshopId, userId);
      if (!assignment) throw memberNotFound();
      return { assignment, created };
    },

    /** RF-304: retira la asignación sin afectar la membresía. */
    async unassign(ctx: OrgContext, workshopId: string, userId: string): Promise<void> {
      assertOwner(ctx);
      await load(ctx, workshopId);

      const membership = isUuid(userId) ? await repo.findMembership(ctx.orgId, userId) : null;
      if (!membership) throw memberNotFound();

      await repo.deleteAssignment(ctx.orgId, workshopId, membership.id);
    },
  };
}
