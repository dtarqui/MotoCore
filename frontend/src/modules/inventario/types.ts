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

/** Los seis tipos del historial. `ajuste` fija un valor absoluto (RN-09). */
export const MOVEMENT_TYPES = ['compra', 'venta', 'ajuste', 'devolucion', 'merma', 'transferencia'] as const
export type MovementType = (typeof MOVEMENT_TYPES)[number]

/**
 * Tipos que el usuario puede registrar DIRECTAMENTE (RF-604), espejo de
 * `DIRECT_MOVEMENT_TYPES` en el servidor. `transferencia` queda fuera: no se
 * registra a mano, la genera la transferencia entre talleres (RF-608) como par
 * de movimientos vinculados — ofrecerla aquí produciría un envío que el
 * servidor rechaza con `inventory.invalid_movement_type`.
 */
export const DIRECT_MOVEMENT_TYPES = ['compra', 'venta', 'ajuste', 'devolucion', 'merma'] as const
export type DirectMovementType = (typeof DIRECT_MOVEMENT_TYPES)[number]

export const MOVEMENT_LABELS: Record<MovementType, string> = {
  compra: 'Compra',
  venta: 'Venta',
  ajuste: 'Ajuste',
  devolucion: 'Devolución',
  merma: 'Merma',
  transferencia: 'Transferencia',
}

/** Cómo afecta cada tipo a la existencia (RN-09). El cálculo lo hace el servidor. */
export const MOVEMENT_EFFECT: Record<DirectMovementType, 'suma' | 'resta' | 'fija'> = {
  compra: 'suma',
  devolucion: 'suma',
  venta: 'resta',
  merma: 'resta',
  ajuste: 'fija',
}

export type PartMovement = {
  id: string
  organization_id: string
  workshop_id: string
  part_id: string
  movement_type: MovementType
  quantity: number
  previous_stock: number
  new_stock: number
  unit_cost: number | null
  total_cost: number | null
  reference: string | null
  notes: string | null
  /** Vincula los dos movimientos de una transferencia: salida y entrada (RN-13). */
  transfer_id: string | null
  performed_by: string | null
  created_at: string
}

export type CreatePartPayload = {
  part_number: string
  name: string
  description?: string
  brand?: string
  category?: string
  /** Si es mayor que cero, el servidor genera su movimiento de entrada (RN-12). */
  initial_stock?: number
  minimum_stock?: number
  maximum_stock?: number
  unit_cost?: number
}

export type CreateMovementPayload = {
  movement_type: DirectMovementType
  quantity: number
  unit_cost?: number
  reference?: string
  notes?: string
}

/** RF-609: el número de parte no se edita — identifica la pieza dentro del taller. */
export type UpdatePartPayload = {
  name?: string
  description?: string | null
  brand?: string | null
  category?: string | null
  minimum_stock?: number
  maximum_stock?: number | null
  unit_cost?: number | null
}

/**
 * RF-608: transferencia al mismo número de parte en otro taller de la
 * organización. El destino se indica por taller, no por repuesto: es la misma
 * pieza, con existencia propia en cada local.
 */
export type TransferPartPayload = {
  to_workshop_id: string
  quantity: number
  notes?: string
}
