/**
 * Repuesto — entidad de NIVEL TALLER. Lleva `workshop_id` además de
 * `organization_id`: cada local tiene existencias físicas propias (RF-602).
 */
export type Part = {
  id: string
  organization_id: string
  workshop_id: string
  part_number: string
  name: string
  description: string | null
  brand: string | null
  category: string | null
  current_stock: number
  minimum_stock: number
  maximum_stock: number | null
  unit_cost: number | null
  is_active: boolean
  created_at: string
  updated_at: string | null
}

/** Los seis tipos documentados. `adjustment` fija un valor absoluto (RF-605). */
export const MOVEMENT_TYPES = ['purchase', 'sale', 'adjustment', 'return', 'transfer', 'damaged'] as const
export type MovementType = (typeof MOVEMENT_TYPES)[number]

/**
 * Tipos que el usuario puede registrar DIRECTAMENTE (RF-604), espejo de
 * `DIRECT_MOVEMENT_TYPES` en `server/src/schemas.ts`. `transfer` queda fuera:
 * no se registra a mano, lo genera la transferencia entre talleres (RF-608)
 * como par de movimientos vinculados — ofrecerlo aquí produciría un envío que
 * el backend rechaza con `inventory.invalid_movement_type`.
 */
export const DIRECT_MOVEMENT_TYPES = MOVEMENT_TYPES.filter((t) => t !== 'transfer') as readonly Exclude<
  MovementType,
  'transfer'
>[]

export const MOVEMENT_LABELS: Record<MovementType, string> = {
  purchase: 'Compra',
  sale: 'Venta',
  adjustment: 'Ajuste',
  return: 'Devolución',
  transfer: 'Transferencia',
  damaged: 'Merma',
}

export type PartMovement = {
  id: string
  part_id: string
  movement_type: MovementType
  quantity: number
  previous_stock: number
  new_stock: number
  unit_cost: number | null
  total_cost: number | null
  reference: string | null
  notes: string | null
  performed_by: string | null
  created_at: string
}

export type CreatePartPayload = {
  partNumber: string
  name: string
  description?: string
  brand?: string
  category?: string
  initialStock?: number
  minimumStock?: number
  maximumStock?: number
  unitCost?: number
}

export type CreateMovementPayload = {
  movementType: MovementType
  quantity: number
  unitCost?: number
  reference?: string
  notes?: string
}

/** RF-609: el número de parte no se edita — identifica la pieza dentro del taller. */
export type UpdatePartPayload = {
  name?: string
  description?: string | null
  brand?: string | null
  category?: string | null
  minimumStock?: number
  maximumStock?: number | null
  unitCost?: number | null
}

/** RF-608: transferencia entre talleres de la misma organización. */
export type TransferPartPayload = {
  toWorkshopId: string
  toPartId: string
  quantity: number
}
