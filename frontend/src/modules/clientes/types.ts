/**
 * Cliente — entidad de NIVEL EMPRESA. No lleva sucursal: se atiende en
 * cualquiera de los locales de la empresa (RF-502).
 *
 * Los campos llegan tal como los devuelve la API, en snake_case, para no
 * introducir una capa de traducción que haya que mantener en dos sitios.
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
  firstName: string
  lastName: string
  email?: string
  phone?: string
  documentId?: string
  address?: string
  notes?: string
}
