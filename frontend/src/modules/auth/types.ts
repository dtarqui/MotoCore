/**
 * Identificadores de rol tal como viajan por la API y viven en la base de
 * datos. El texto visible al usuario se traduce en la interfaz; estos valores
 * no se traducen ni se capitalizan (Glosario).
 */
export type UserRole = 'owner' | 'mechanic' | 'receptionist'

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Propietario',
  mechanic: 'Mecánico',
  receptionist: 'Recepcionista',
}

/**
 * Los campos llegan tal como los devuelve la API, en `snake_case` (§2.4 del
 * contrato): el contrato y el esquema hablan un solo vocabulario, y no hay una
 * capa de traducción que mantener en dos sitios.
 */
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
  description: string | null
  address: string | null
  phone: string | null
  email: string | null
  owner_id: string
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
  user_id: string
  email: string
  profile: UserProfile | null
  organizations: OrganizationMembership[]
}

export type RegisterRequest = {
  email: string
  password: string
  first_name: string
  last_name: string
  /** RF-101: el registro crea la organización y su primer taller. */
  organization_name: string
  workshop_name?: string
}
