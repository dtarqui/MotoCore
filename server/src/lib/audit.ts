import { serviceClient } from './supabase.js';

/** Las seis acciones críticas que deben quedar registradas (RF-703). */
export const AUDIT_ACTIONS = [
  'member.invited',
  'member.role_changed',
  'member.removed',
  'organization.updated',
  'workshop.deactivated',
  'client.deactivated',
] as const;
export type AuditAction = (typeof AUDIT_ACTIONS)[number];

export interface AuditEntry {
  organizationId: string;
  workshopId?: string | null;
  performedBy: string;
  action: AuditAction;
  entity: 'organization' | 'workshop' | 'membership' | 'client';
  entityId?: string | null;
  details?: Record<string, unknown>;
}

/** Quien deja constancia de una acción crítica. Los servicios dependen de esta interfaz, no del proveedor. */
export interface AuditRecorder {
  record(entry: AuditEntry): Promise<void>;
}

/**
 * Escritura con la credencial del servidor (excepción 7 de ADR-008): ninguna
 * política permite insertar en `mt_audit_log`, de modo que un miembro no puede
 * falsear el registro por acceso directo (RN-15).
 *
 * No lanza. La acción ya se completó y un fallo al auditarla no debe
 * convertirse en un `500`, que el contrato reserva para operaciones que no
 * dejaron nada aplicado (§2.6). El fallo queda en el registro operativo.
 */
export const supabaseAuditRecorder: AuditRecorder = {
  async record(entry) {
    const { error } = await serviceClient('audit-write')
      .from('mt_audit_log')
      .insert({
        organization_id: entry.organizationId,
        workshop_id: entry.workshopId ?? null,
        performed_by: entry.performedBy,
        action: entry.action,
        entity: entry.entity,
        entity_id: entry.entityId ?? null,
        details: entry.details ?? null,
      });

    if (error) {
      console.error('[audit] no se pudo registrar la acción', {
        action: entry.action,
        org: entry.organizationId,
        cause: error.message,
      });
    }
  },
};
