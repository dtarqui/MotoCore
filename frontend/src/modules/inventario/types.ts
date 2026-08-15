/**
 * Repuesto — entidad de NIVEL SUCURSAL. Lleva `workshop_id` además de
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
