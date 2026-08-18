import { apiRequest } from '@/shared/lib/api-client'
import type { UserProfile } from '../auth/types'

/**
 * Acciones críticas que el sistema registra — RF-703.
 *
 * El tipo es cerrado a propósito: si el backend empieza a registrar una acción
 * nueva, la interfaz debe declararla aquí para poder etiquetarla, en lugar de
 * mostrar un identificador crudo al usuario.
 */
export type AuditAction =
  | 'member.invited'
  | 'member.role_changed'
  | 'member.removed'
  | 'workshop.deactivated'
  | 'client.deactivated'
  | 'organization.updated'

export const AUDIT_ACTION_LABELS: Record<AuditAction, string> = {
  'member.invited': 'Miembro invitado',
  'member.role_changed': 'Rol modificado',
  'member.removed': 'Miembro removido',
  'workshop.deactivated': 'Sucursal desactivada',
  'client.deactivated': 'Cliente dado de baja',
  'organization.updated': 'Datos de la empresa editados',
}

export type AuditEntry = {
  id: string
  organizationId: string
  workshopId: string | null
  performedBy: string | null
  /**
   * Perfil de quien ejecutó la acción. Puede venir nulo: el registro no tiene
   * clave foránea al usuario, de modo que sobrevive al borrado de la cuenta.
   * Un nulo aquí es el comportamiento correcto, no un fallo de carga.
   */
  performedByProfile: UserProfile | null
  action: AuditAction
  entity: string
  entityId: string | null
  details: Record<string, unknown> | null
  createdAt: string
}

export type AuditFilters = {
  action?: AuditAction | ''
  workshopId?: string
  limit?: number
}

/**
 * Registro de acciones críticas de la empresa activa — RF-703, RF-704.
 *
 * Reservado al Owner. Un rol distinto recibe `403 audit.insufficient_permissions`,
 * y la restricción se sostiene también en la base de datos.
 */
export function getAuditLog(filters: AuditFilters = {}) {
  const params = new URLSearchParams()
  if (filters.action) params.set('action', filters.action)
  if (filters.workshopId) params.set('workshopId', filters.workshopId)
  if (filters.limit) params.set('limit', String(filters.limit))

  const query = params.toString()
  return apiRequest<{ audit: AuditEntry[] }>(`/api/audit${query ? `?${query}` : ''}`).then(
    (r) => r.audit,
  )
}
