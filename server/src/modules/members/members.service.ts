import type { AuditRecorder } from '../../lib/audit.js';
import { UniqueViolation } from '../../lib/db.js';
import { conflict, forbidden, notFound } from '../../lib/errors.js';
import { isUuid, MALFORMED_BODY } from '../../lib/http.js';
import { parseBody } from '../../lib/validation.js';
import type { OrgContext } from '../../types.js';
import type { MemberRow, MembersRepository } from './members.repository.js';
import { inviteMemberSchema, updateRoleSchema } from './members.schemas.js';

export interface MembersDeps {
  repo: MembersRepository;
  audit: AuditRecorder;
}

const memberNotFound = () => notFound('member.not_found', 'La cuenta no es miembro de esta organización.');
const alreadyActive = () => conflict('member.already_active', 'La cuenta ya es miembro activo de la organización.');

/** Solo el Owner gestiona miembros (RF-406). El código nombra el módulo, como fija el §4 del contrato. */
function assertOwner(ctx: OrgContext): void {
  if (ctx.role !== 'owner') {
    throw forbidden('member.insufficient_permissions', 'Solo el Owner puede gestionar miembros.');
  }
}

/**
 * RF-402: nadie se incorpora ni asciende directamente a `owner`.
 *
 * Se comprueba ANTES del esquema y con su código propio (403), en lugar de dejar
 * que el enum lo rechace como entrada mal formada: no es que el valor sea
 * inválido, es que la operación no está permitida.
 */
function assertRoleNotOwner(body: unknown): void {
  const role = body !== MALFORMED_BODY ? (body as { role?: unknown } | null)?.role : undefined;
  if (role === 'owner') {
    throw forbidden('member.owner_role_forbidden', 'No se puede asignar el rol Owner.');
  }
}

/**
 * Miembros de la organización activa — RF-401 a RF-407.
 *
 * La membresía se revoca con baja lógica: la fila queda con `is_active = false`,
 * y reincorporar a esa cuenta la **reactiva** en lugar de duplicarla (RN-04).
 */
export function createMembersService({ repo, audit }: MembersDeps) {
  /** RF-405: ni se cambia el rol del propietario ni se le remueve. */
  async function assertNotOwnerOf(ctx: OrgContext, userId: string, message: string): Promise<void> {
    if ((await repo.findOwnerId(ctx.orgId)) === userId) {
      throw forbidden('member.owner_protected', message);
    }
  }

  async function activeMember(ctx: OrgContext, userId: string): Promise<MemberRow> {
    const member = isUuid(userId) ? await repo.findMember(ctx.orgId, userId) : null;
    if (!member?.is_active) throw memberNotFound();
    return member;
  }

  return {
    /** RF-407: con rol y estado. Por omisión, solo los activos (§2.5 del contrato). */
    list(ctx: OrgContext, options: { includeInactive: boolean }): Promise<MemberRow[]> {
      return repo.list(ctx.orgId, options);
    },

    /** RF-401, RF-402, RF-406. Acción auditada (RF-703). */
    async invite(ctx: OrgContext, body: unknown): Promise<MemberRow> {
      assertOwner(ctx);
      assertRoleNotOwner(body);
      const input = parseBody(inviteMemberSchema, body);

      // Un correo sin cuenta responde lo mismo que no poder invitarlo, sin
      // exponer la búsqueda de cuentas como operación (RNF-106).
      const userId = await repo.findAccountIdByEmail(input.email);
      if (!userId) throw notFound('member.not_found', 'No es posible invitar a ese correo.');

      const existing = await repo.findMember(ctx.orgId, userId);
      if (existing?.is_active) throw alreadyActive();

      try {
        if (existing) {
          await repo.update(ctx.orgId, userId, { role: input.role, is_active: true });
        } else {
          await repo.insert(ctx.orgId, userId, input.role);
        }
      } catch (error) {
        // Otra invitación simultánea incorporó a la misma cuenta.
        if (error instanceof UniqueViolation) throw alreadyActive();
        throw error;
      }

      await audit.record({
        organizationId: ctx.orgId,
        performedBy: ctx.userId,
        action: 'member.invited',
        entity: 'membership',
        entityId: userId,
        details: { role: input.role, reactivated: Boolean(existing) },
      });

      return activeMember(ctx, userId);
    },

    /** RF-403, RF-405. Surte efecto en la petición siguiente. Acción auditada. */
    async changeRole(ctx: OrgContext, userId: string, body: unknown): Promise<MemberRow> {
      assertOwner(ctx);
      assertRoleNotOwner(body);
      const input = parseBody(updateRoleSchema, body);
      await assertNotOwnerOf(ctx, userId, 'No se puede cambiar el rol del Owner.');

      const member = await activeMember(ctx, userId);
      const previousRole = member.role;
      if (previousRole === input.role) return member;

      await repo.update(ctx.orgId, userId, { role: input.role });
      await audit.record({
        organizationId: ctx.orgId,
        performedBy: ctx.userId,
        action: 'member.role_changed',
        entity: 'membership',
        entityId: userId,
        details: { from: previousRole, to: input.role },
      });

      return activeMember(ctx, userId);
    },

    /** RF-404, RF-405. El acceso se pierde de inmediato. Acción auditada. */
    async remove(ctx: OrgContext, userId: string): Promise<void> {
      assertOwner(ctx);
      await assertNotOwnerOf(ctx, userId, 'No se puede remover al Owner de la organización.');
      const member = await activeMember(ctx, userId);

      await repo.update(ctx.orgId, userId, { is_active: false });
      await audit.record({
        organizationId: ctx.orgId,
        performedBy: ctx.userId,
        action: 'member.removed',
        entity: 'membership',
        entityId: userId,
        details: { role: member.role },
      });
    },
  };
}
