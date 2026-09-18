import { apiRequest } from '@/shared/lib/api-client'
import type {
  CreateMovementPayload,
  CreatePartPayload,
  Part,
  PartMovement,
  TransferPartPayload,
  UpdatePartPayload,
} from './types'

/**
 * Inventario: nivel taller. TODAS las llamadas usan `withWorkshop`, porque el
 * servidor exige el taller activo y rechaza la petición sin él (RF-303).
 */
const withWorkshop = { withWorkshop: true } as const

export function getParts(options?: { search?: string; lowStock?: boolean; includeInactive?: boolean }) {
  const params = new URLSearchParams()
  if (options?.search?.trim()) params.set('search', options.search.trim())
  if (options?.lowStock) params.set('lowStock', 'true')
  if (options?.includeInactive) params.set('includeInactive', 'true')
  const query = params.toString() ? `?${params.toString()}` : ''

  return apiRequest<{ parts: Part[] }>(`/api/inventory/parts${query}`, withWorkshop).then((r) => r.parts)
}

/** RF-607: repuestos en o por debajo del mínimo. */
export function getLowStockParts() {
  return getParts({ lowStock: true })
}

/**
 * Catálogo de un taller que NO es el activo — lectura puntual, por ejemplo para
 * comprobar el destino de una transferencia (RF-608) sin abandonar el taller de
 * origen.
 */
export function getPartsInWorkshop(workshopId: string, options?: { search?: string }) {
  const params = new URLSearchParams()
  if (options?.search?.trim()) params.set('search', options.search.trim())
  const query = params.toString() ? `?${params.toString()}` : ''

  return apiRequest<{ parts: Part[] }>(`/api/inventory/parts${query}`, { workshopId }).then((r) => r.parts)
}

export function createPart(payload: CreatePartPayload) {
  const body: Record<string, unknown> = {
    part_number: payload.part_number.trim(),
    name: payload.name.trim(),
  }
  if (payload.description?.trim()) body.description = payload.description.trim()
  if (payload.brand?.trim()) body.brand = payload.brand.trim()
  if (payload.category?.trim()) body.category = payload.category.trim()
  if (payload.initial_stock !== undefined) body.initial_stock = payload.initial_stock
  if (payload.minimum_stock !== undefined) body.minimum_stock = payload.minimum_stock
  if (payload.maximum_stock !== undefined) body.maximum_stock = payload.maximum_stock
  if (payload.unit_cost !== undefined) body.unit_cost = payload.unit_cost

  return apiRequest<{ part: Part }>('/api/inventory/parts', {
    ...withWorkshop,
    method: 'POST',
    body: JSON.stringify(body),
  }).then((r) => r.part)
}

/** Edita el catálogo de un repuesto — RF-609. El número de parte no se incluye: no se edita. */
export function updatePart(partId: string, payload: UpdatePartPayload) {
  return apiRequest<{ part: Part }>(`/api/inventory/parts/${partId}`, {
    ...withWorkshop,
    method: 'PATCH',
    body: JSON.stringify(payload),
  }).then((r) => r.part)
}

export function getMovements(partId: string) {
  return apiRequest<{ movements: PartMovement[] }>(`/api/inventory/parts/${partId}/movements`, withWorkshop).then(
    (r) => r.movements,
  )
}

/**
 * Registra un movimiento. El recálculo de la existencia ocurre en el servidor,
 * dentro de una transacción (ADR-007): el cliente nunca calcula el stock.
 */
export function createMovement(partId: string, payload: CreateMovementPayload) {
  const body: Record<string, unknown> = {
    movement_type: payload.movement_type,
    quantity: payload.quantity,
  }
  if (payload.unit_cost !== undefined) body.unit_cost = payload.unit_cost
  if (payload.reference?.trim()) body.reference = payload.reference.trim()
  if (payload.notes?.trim()) body.notes = payload.notes.trim()

  return apiRequest<{ movement: PartMovement }>(`/api/inventory/parts/${partId}/movements`, {
    ...withWorkshop,
    method: 'POST',
    body: JSON.stringify(body),
  }).then((r) => r.movement)
}

/**
 * Transfiere existencias al repuesto con el mismo número de parte en otro
 * taller — RF-608. Reservada al Owner; el origen es el taller activo, por eso
 * usa `withWorkshop`. Devuelve los dos movimientos vinculados.
 */
export function transferPart(partId: string, payload: TransferPartPayload) {
  return apiRequest<{ movements: PartMovement[] }>(`/api/inventory/parts/${partId}/transfer`, {
    ...withWorkshop,
    method: 'POST',
    body: JSON.stringify(payload),
  }).then((r) => r.movements)
}
