import { z } from 'zod';
import { AUDIT_ACTIONS } from '../../lib/audit.js';
import { forbidden } from '../../lib/errors.js';
import type { OrgContext } from '../../types.js';
import type { AuditRepository, AuditRow, AuthorProfile } from './audit.repository.js';

export interface AuditDeps {
  repo: AuditRepository;
}

export interface AuditEntryView extends AuditRow {
  /**
   * Perfil del autor. Puede ser nulo: `performed_by` no tiene clave ajena, de
   * modo que la entrada sobrevive al borrado de la cuenta (RF-703). Un nulo es
   * el comportamiento correcto, no un fallo.
   */
  performed_by_profile: AuthorProfile | null;
}

export const DEFAULT_LIMIT = 100;
export const MAX_LIMIT = 500;

/** Filtros opcionales del listado. Ampliación sin ruptura del contrato (§6). */
export const auditFiltersSchema = z.object({
  action: z.enum(AUDIT_ACTIONS).optional(),
  workshopId: z.string().uuid('Identificador de taller inválido.').optional(),
  limit: z.coerce.number().int().min(1).max(MAX_LIMIT).default(DEFAULT_LIMIT),
});

/**
 * Registro de acciones críticas — RF-703, RF-704.
 *
 * Es la única lectura de la interfaz reservada a un rol, y no expone ninguna
 * operación de escritura: el registro es de solo inserción.
 */
export function createAuditService({ repo }: AuditDeps) {
  return {
    async list(ctx: OrgContext, query: Record<string, string | undefined>): Promise<AuditEntryView[]> {
      if (ctx.role !== 'owner') {
        throw forbidden('audit.insufficient_permissions', 'Solo el Owner puede consultar la auditoría.');
      }
      const filters = auditFiltersSchema.parse(query);

      const rows = await repo.list(ctx.orgId, filters);
      const authors = [...new Set(rows.map((r) => r.performed_by).filter((id): id is string => Boolean(id)))];
      const profiles = new Map((await repo.profiles(authors)).map((p) => [p.id, p]));

      return rows.map((row) => ({
        ...row,
        performed_by_profile: row.performed_by ? (profiles.get(row.performed_by) ?? null) : null,
      }));
    },
  };
}
