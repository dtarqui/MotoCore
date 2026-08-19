/**
 * Identificadores de rol tal como viajan por la API y viven en la base de
 * datos. El texto visible al usuario se traduce en la interfaz; estos valores
 * no se traducen ni se capitalizan.
 */
export type UserRole = 'owner' | 'mechanic' | 'receptionist'

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Propietario',
  mechanic: 'Mecánico',
  receptionist: 'Recepcionista',
}

export type UserProfile = {
  id: string
  email: string
  first_name: string
  last_name: string
}

/** Organización: unidad de aislamiento. Una cuenta puede pertenecer a varias. */
export type Organization = {
  id: string
  name: string
  is_active: boolean
}

/** Taller: subdivisión operativa de una organización, no frontera de seguridad. */
export type Workshop = {
  id: string
  organization_id: string
  name: string
  address: string | null
  phone: string | null
  is_active: boolean
}

/** Una organización junto al rol que la cuenta tiene *en esa organización*. */
export type OrganizationMembership = {
  role: UserRole
  organization: Organization
}

export type MeResponse = {
  userId: string
  email: string
  profile: UserProfile | null
  organizations: OrganizationMembership[]
}

export type LoginRequest = {
  email: string
  password: string
}

export type RegisterRequest = {
  email: string
  password: string
  firstName: string
  lastName: string
  /** RF-101: el registro crea la organización y su primer taller. */
  organizationName: string
  workshopName?: string
}
