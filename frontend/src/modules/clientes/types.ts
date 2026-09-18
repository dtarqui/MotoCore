/**
 * Cliente — entidad de NIVEL ORGANIZACIÓN. No lleva taller: se atiende en
 * cualquiera de los locales de la organización (RF-502).
 *
 * Los campos van tal como los recibe y los espera la API, en `snake_case`
 * (§2.4 del contrato), para no introducir una capa de traducción que haya que
 * mantener en dos sitios.
 */
export type Client = {
  id: string
  organization_id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  document_id: string | null
  address: string | null
  notes: string | null
  is_active: boolean
  created_at: string
  updated_at: string | null
}

export type ClientUpsertPayload = {
  first_name: string
  last_name: string
  email?: string
  phone?: string
  document_id?: string
  address?: string
  notes?: string
}
