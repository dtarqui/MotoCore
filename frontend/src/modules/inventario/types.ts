export const PART_MOVEMENT_TYPES = [
  'Purchase',
  'Sale',
  'Adjustment',
  'Return',
  'Transfer',
  'Damaged',
] as const

export type PartMovementTypeValue = (typeof PART_MOVEMENT_TYPES)[number]

export const PART_MOVEMENT_TYPE_LABELS: Record<PartMovementTypeValue, string> = {
  Purchase: 'Compra',
  Sale: 'Venta',
  Adjustment: 'Ajuste',
  Return: 'Devolución',
  Transfer: 'Transferencia',
  Damaged: 'Dañado',
}

export type Part = {
  id: string
  workshopId: string
  partNumber: string
  name: string
  description: string | null
  brand: string | null
  category: string | null
  currentStock: number
  minimumStock: number
  maximumStock: number
  unitCost: number
  salePrice: number
  location: string | null
  supplierName: string | null
  supplierContact: string | null
  notes: string | null
  isActive: boolean
  createdAtUtc: string
}

export type CreatePartPayload = {
  partNumber: string
  name: string
  description?: string
  brand?: string
  category?: string
  initialStock: number
  minimumStock: number
  maximumStock: number
  unitCost: number
  salePrice: number
  location?: string
  supplierName?: string
  supplierContact?: string
  notes?: string
}

export type UpdatePartPayload = Omit<CreatePartPayload, 'partNumber' | 'initialStock'>

export type PartMovement = {
  id: string
  workshopId: string
  partId: string
  movementType: PartMovementTypeValue
  quantity: number
  previousStock: number
  newStock: number
  unitCost: number | null
  totalCost: number | null
  workOrderId: string | null
  createdByUserId: string
  reference: string | null
  notes: string | null
  createdAtUtc: string
}

export type CreatePartMovementPayload = {
  partId: string
  movementType: PartMovementTypeValue
  quantity: number
  unitCost?: number
  reference?: string
  notes?: string
}
