import { serviceClient } from './supabase.js';

/** Acciones criticas que deben quedar registradas (RF-703). */
export type AuditAction =
  | 'member.invited'
  | 'member.role_changed'
  | 'member.removed'
  | 'workshop.deactivated'
  | 'client.deactivated'
  | 'organization.updated';

interface AuditEntry {
  organizationId: string;
  workshopId?: string | null;
  performedBy: string;
  action: AuditAction;
  entity: string;
  entityId?: string | null;
  details?: Record<string, unknown>;
}

/**
 * Deja constancia de una accion critica.
 *
 * No lanza: un fallo al auditar no debe revertir una operacion que ya se
 * completo correctamente. Se registra en consola para que el fallo sea
 * visible sin convertirlo en un error de cara al usuario.
 */
export async function recordAudit(entry: AuditEntry): Promise<void> {
  const { error } = await serviceClient().from('mt_audit_log').insert({
    organization_id: entry.organizationId,
    workshop_id: entry.workshopId ?? null,
    performed_by: entry.performedBy,
    action: entry.action,
    entity: entry.entity,
    entity_id: entry.entityId ?? null,
    details: entry.details ?? null,
  });

  if (error) console.error('[audit] no se pudo registrar la accion', entry.action, error.message);
}
