import { apiRequest } from '@/shared/lib/api-client'
import type { Client, ClientUpsertPayload } from './types'

/**
 * Clientes: nivel organización. Ninguna llamada usa `withWorkshop`, y esa
 * ausencia es intencional — el cliente se ve igual desde cualquier taller de la
 * organización (RF-502).
 */

/** Omite las cadenas vacías para no enviar campos en blanco que el esquema rechazaría. */
function normalize(payload: ClientUpsertPayload) {
  const body: Record<string, string> = {
    first_name: payload.first_name.trim(),
    last_name: payload.last_name.trim(),
  }
  const optional: Array<[string, string | undefined]> = [
    ['email', payload.email],
    ['phone', payload.phone],
    ['document_id', payload.document_id],
    ['address', payload.address],
    ['notes', payload.notes],
  ]
  for (const [key, value] of optional) {
    const trimmed = value?.trim()
    if (trimmed) body[key] = trimmed
  }
  return body
}

export function getClients(options?: { search?: string; includeInactive?: boolean }) {
  const params = new URLSearchParams()
  if (options?.search?.trim()) params.set('search', options.search.trim())
  if (options?.includeInactive) params.set('includeInactive', 'true')
  const query = params.toString() ? `?${params.toString()}` : ''

  return apiRequest<{ clients: Client[] }>(`/api/clients${query}`).then((r) => r.clients)
}

export function getClientById(clientId: string) {
  return apiRequest<{ client: Client }>(`/api/clients/${clientId}`).then((r) => r.client)
}

export function createClient(payload: ClientUpsertPayload) {
  return apiRequest<{ client: Client }>('/api/clients', {
    method: 'POST',
    body: JSON.stringify(normalize(payload)),
  }).then((r) => r.client)
}

export function updateClient(clientId: string, payload: ClientUpsertPayload) {
  return apiRequest<{ client: Client }>(`/api/clients/${clientId}`, {
    method: 'PATCH',
    body: JSON.stringify(normalize(payload)),
  }).then((r) => r.client)
}

/**
 * Baja lógica: conserva el registro y su historial (RF-504).
 *
 * Es `POST /deactivate` y no `PATCH`: una transición de estado auditada no se
 * modela como la edición de un campo (§2.6 del contrato).
 */
export function deactivateClient(clientId: string) {
  return apiRequest<{ client: Client }>(`/api/clients/${clientId}/deactivate`, {
    method: 'POST',
  }).then((r) => r.client)
}
