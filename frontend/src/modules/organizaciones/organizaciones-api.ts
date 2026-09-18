import { apiRequest } from '@/shared/lib/api-client'
import type { Organization, OrganizationMembership, UserRole, Workshop } from '../auth/types'

/**
 * Organizaciones, talleres y miembros.
 *
 * Regla de rutas del §2.3 del contrato: el identificador de la organización
 * aparece en la ruta **solo cuando el recurso es la organización misma**. Los
 * talleres y los miembros son recursos interiores a ella, de modo que se piden
 * a `/api/workshops` y `/api/members`, con la organización activa viajando en
 * la cabecera `X-Org-Id` que adjunta `apiRequest` (ADR-005).
 */

/** Organizaciones donde la cuenta tiene membresía activa — RF-202. */
export function getOrganizations() {
  return apiRequest<{ organizations: OrganizationMembership[] }>('/api/organizations').then((r) => r.organizations)
}

export type OrganizationPayload = {
  name: string
  description?: string | null
  address?: string | null
  phone?: string | null
  email?: string | null
}

/** Crea una organización adicional; el creador queda como Owner — RF-201. */
export function createOrganization(payload: OrganizationPayload) {
  return apiRequest<{ organization: Organization }>('/api/organizations', {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((r) => r.organization)
}

/**
 * Edita los datos de la organización activa (solo Owner) — RF-204.
 *
 * Única función del módulo cuya ruta lleva el identificador de organización:
 * aquí la organización es el recurso, no el contexto (§2.3 del contrato).
 */
export function updateOrganization(orgId: string, payload: Partial<OrganizationPayload>) {
  return apiRequest<{ organization: Organization }>(`/api/organizations/${orgId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }).then((r) => r.organization)
}

/** Talleres de la organización activa — RF-302. Por omisión, solo los activos. */
export function getWorkshops(options?: { includeInactive?: boolean }) {
  const query = options?.includeInactive ? '?includeInactive=true' : ''
  return apiRequest<{ workshops: Workshop[] }>(`/api/workshops${query}`).then((r) => r.workshops)
}

export type WorkshopPayload = {
  name: string
  address?: string | null
  phone?: string | null
}

/** Crea un taller en la organización activa (solo Owner) — RF-301. */
export function createWorkshop(payload: WorkshopPayload) {
  return apiRequest<{ workshop: Workshop }>('/api/workshops', {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((r) => r.workshop)
}

/** Edita los datos de un taller (solo Owner) — RF-301. */
export function updateWorkshop(workshopId: string, payload: Partial<WorkshopPayload>) {
  return apiRequest<{ workshop: Workshop }>(`/api/workshops/${workshopId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  }).then((r) => r.workshop)
}

/**
 * Baja lógica del taller; conserva su historial — RF-305.
 *
 * Es `POST /deactivate` y no `PATCH`: una transición de estado auditada no se
 * modela como la edición de un campo (§2.6 del contrato).
 */
export function deactivateWorkshop(workshopId: string) {
  return apiRequest<{ workshop: Workshop }>(`/api/workshops/${workshopId}/deactivate`, {
    method: 'POST',
  }).then((r) => r.workshop)
}

/**
 * Asignación operativa de un miembro a un taller: indica dónde trabaja, no
 * cambia lo que puede ver (RF-304, ADR-006).
 */
export type WorkshopAssignment = {
  id: string
  organization_id: string
  workshop_id: string
  user_id: string
  role: UserRole
  is_active: boolean
  created_at: string
}

/** Miembros asignados al taller — RF-304. */
export function getWorkshopAssignments(workshopId: string) {
  return apiRequest<{ assignments: WorkshopAssignment[] }>(`/api/workshops/${workshopId}/assignments`).then(
    (r) => r.assignments,
  )
}

/** Asigna un miembro al taller (solo Owner) — RF-304. Es idempotente. */
export function assignMemberToWorkshop(workshopId: string, userId: string) {
  return apiRequest<{ assignment: WorkshopAssignment }>(`/api/workshops/${workshopId}/assignments`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId }),
  }).then((r) => r.assignment)
}

/** Retira la asignación de un miembro al taller (solo Owner) — RF-304. */
export function removeWorkshopAssignment(workshopId: string, userId: string) {
  return apiRequest<void>(`/api/workshops/${workshopId}/assignments/${userId}`, { method: 'DELETE' })
}

/** Miembro de la organización activa, con su rol, su estado y sus datos de perfil — RF-407. */
export type Member = {
  user_id: string
  role: UserRole
  is_active: boolean
  joined_at: string
  updated_at: string | null
  email: string | null
  first_name: string | null
  last_name: string | null
}

/** Miembros de la organización activa — RF-407. Por omisión, solo los activos. */
export function getMembers(options?: { includeInactive?: boolean }) {
  const query = options?.includeInactive ? '?includeInactive=true' : ''
  return apiRequest<{ members: Member[] }>(`/api/members${query}`).then((r) => r.members)
}

/** Roles que se pueden conceder: el Owner es quien crea la organización (RF-402). */
export type AssignableRole = Exclude<UserRole, 'owner'>

/** Invita a una cuenta existente — RF-401, RF-402. */
export function inviteMember(payload: { email: string; role: AssignableRole }) {
  return apiRequest<{ member: Member }>('/api/members/invite', {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((r) => r.member)
}

/** Cambia el rol de un miembro — RF-403. */
export function updateMemberRole(userId: string, role: AssignableRole) {
  return apiRequest<{ member: Member }>(`/api/members/${userId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  }).then((r) => r.member)
}

/**
 * Revoca la membresía; el acceso se pierde de inmediato — RF-404.
 *
 * Sigue siendo `DELETE` y no `POST /deactivate`: lo que se revoca es el
 * **vínculo** entre la cuenta y la organización, no el estado de un recurso
 * propio. El §2.6 del contrato declara esa excepción para los vínculos.
 */
export function removeMember(userId: string) {
  return apiRequest<void>(`/api/members/${userId}`, { method: 'DELETE' })
}
