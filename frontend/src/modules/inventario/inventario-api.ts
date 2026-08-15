import { apiRequest } from '@/shared/lib/api-client'
import type { CreateMovementPayload, CreatePartPayload, Part, PartMovement } from './types'

/**
 * Inventario: nivel sucursal. TODAS las llamadas usan `withWorkshop`, porque el
 * servidor exige la sucursal activa y rechaza la petición sin ella (RF-303).
 */
const withWorkshop = { withWorkshop: true } as const

export function getParts(options?: { search?: string; lowStock?: boolean }) {
  const params = new URLSearchParams()
  if (options?.search?.trim()) params.set('search', options.search.trim())
  if (options?.lowStock) params.set('lowStock', 'true')
  const query = params.toString() ? `?${params.toString()}` : ''

  return apiRequest<{ parts: Part[] }>(`/api/inventory/parts${query}`, withWorkshop).then(
    (r) => r.parts,
  )
}

/** RF-607: repuestos en o por debajo del mínimo. */
export function getLowStockParts() {
  return getParts({ lowStock: true })
}

export function createPart(payload: CreatePartPayload) {
  const body: Record<string, unknown> = {
    partNumber: payload.partNumber.trim(),
    name: payload.name.trim(),
  }
  if (payload.description?.trim()) body.description = payload.description.trim()
  if (payload.brand?.trim()) body.brand = payload.brand.trim()
  if (payload.category?.trim()) body.category = payload.category.trim()
  if (payload.initialStock !== undefined) body.initialStock = payload.initialStock
  if (payload.minimumStock !== undefined) body.minimumStock = payload.minimumStock
  if (payload.maximumStock !== undefined) body.maximumStock = payload.maximumStock
  if (payload.unitCost !== undefined) body.unitCost = payload.unitCost

  return apiRequest<{ part: Part }>('/api/inventory/parts', {
    ...withWorkshop,
    method: 'POST',
    body: JSON.stringify(body),
  }).then((r) => r.part)
}

export function getMovements(partId: string) {
  return apiRequest<{ movements: PartMovement[] }>(
    `/api/inventory/parts/${partId}/movements`,
    withWorkshop,
  ).then((r) => r.movements)
}

/**
 * Registra un movimiento. El recálculo de la existencia ocurre en el servidor,
 * dentro de una transacción (ADR-007): el cliente nunca calcula el stock.
 */
export function createMovement(partId: string, payload: CreateMovementPayload) {
  const body: Record<string, unknown> = {
    movementType: payload.movementType,
    quantity: payload.quantity,
  }
  if (payload.unitCost !== undefined) body.unitCost = payload.unitCost
  if (payload.reference?.trim()) body.reference = payload.reference.trim()
  if (payload.notes?.trim()) body.notes = payload.notes.trim()

  return apiRequest<{ movement: PartMovement }>(`/api/inventory/parts/${partId}/movements`, {
    ...withWorkshop,
    method: 'POST',
    body: JSON.stringify(body),
  }).then((r) => r.movement)
}
