import { apiRequest } from '@/shared/lib/api-client'
import type { Organization, OrganizationMembership, UserRole, Workshop } from '../auth/types'

/** Empresas donde la cuenta tiene membresía activa — RF-202. */
export function getOrganizations() {
  return apiRequest<{ organizations: OrganizationMembership[] }>('/api/organizations').then(
    (r) => r.organizations,
  )
}

/** Crea una empresa adicional; el creador queda como Owner — RF-201. */
export function createOrganization(payload: { name: string; address?: string; phone?: string }) {
  return apiRequest<{ organization: Organization }>('/api/organizations', {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((r) => r.organization)
}

/** Sucursales de una empresa — RF-302. */
export function getWorkshops(orgId: string) {
  return apiRequest<{ workshops: Workshop[] }>(`/api/organizations/${orgId}/workshops`).then(
    (r) => r.workshops,
  )
}

/** Crea una sucursal dentro de la empresa (solo Owner) — RF-301. */
export function createWorkshop(
  orgId: string,
  payload: { name: string; address?: string; phone?: string },
) {
  return apiRequest<{ workshop: Workshop }>(`/api/organizations/${orgId}/workshops`, {
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((r) => r.workshop)
}

/** Baja lógica de la sucursal; conserva su historial — RF-305. */
export function deactivateWorkshop(orgId: string, workshopId: string) {
  return apiRequest<{ workshop: Workshop }>(
    `/api/organizations/${orgId}/workshops/${workshopId}/deactivate`,
    { method: 'PATCH' },
  ).then((r) => r.workshop)
}

export type Member = {
  userId: string
  role: UserRole
  isActive: boolean
  joinedAt: string
  profile: { email: string; first_name: string; last_name: string } | null
}

/** Miembros de la empresa con su rol y estado — RF-407. */
export function getMembers(orgId: string) {
  return apiRequest<{ members: Member[] }>(`/api/organizations/${orgId}/members`).then(
    (r) => r.members,
  )
}

/** Invita a una cuenta existente. No se puede invitar como Owner — RF-401, RF-402. */
export function inviteMember(orgId: string, payload: { email: string; role: 'mechanic' | 'receptionist' }) {
  return apiRequest<{ userId: string; role: UserRole }>(
    `/api/organizations/${orgId}/members/invite`,
    { method: 'POST', body: JSON.stringify(payload) },
  )
}

/** Cambia el rol de un miembro — RF-403. */
export function updateMemberRole(
  orgId: string,
  userId: string,
  role: 'mechanic' | 'receptionist',
) {
  return apiRequest<{ userId: string; role: UserRole }>(
    `/api/organizations/${orgId}/members/${userId}/role`,
    { method: 'PATCH', body: JSON.stringify({ role }) },
  )
}

/** Remueve a un miembro; pierde el acceso de inmediato — RF-404. */
export function removeMember(orgId: string, userId: string) {
  return apiRequest<void>(`/api/organizations/${orgId}/members/${userId}`, { method: 'DELETE' })
}
