import { apiRequest } from '@/shared/lib/api-client'
import type { Client, ClientUpsertPayload } from './types'

/**
 * Clientes: nivel empresa. Ninguna llamada usa `withWorkshop`, y esa ausencia
 * es intencional — el cliente se ve igual desde cualquier sucursal (RF-502).
 */

/** Omite las cadenas vacías para no enviar un email vacío que falle la validación. */
function normalize(payload: ClientUpsertPayload) {
  const body: Record<string, string> = {
    firstName: payload.firstName.trim(),
    lastName: payload.lastName.trim(),
  }
  const optional: Array<[string, string | undefined]> = [
    ['email', payload.email],
    ['phone', payload.phone],
    ['documentId', payload.documentId],
    ['address', payload.address],
    ['notes', payload.notes],
  ]
  for (const [key, value] of optional) {
    const trimmed = value?.trim()
    if (trimmed) body[key] = trimmed
  }
  return body
}

export function getClients(search?: string) {
  const query = search?.trim() ? `?search=${encodeURIComponent(search.trim())}` : ''
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

/** Baja lógica: conserva el registro y su historial (RF-504). */
export function deactivateClient(clientId: string) {
  return apiRequest<{ client: Client }>(`/api/clients/${clientId}/deactivate`, {
    method: 'PATCH',
  }).then((r) => r.client)
}
