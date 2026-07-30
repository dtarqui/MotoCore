export const WORK_ORDER_STATUSES = [
  'Pending',
  'InDiagnosis',
  'InRepair',
  'Completed',
  'Delivered',
] as const

export type WorkOrderStatusValue = (typeof WORK_ORDER_STATUSES)[number]

export const WORK_ORDER_STATUS_LABELS: Record<WorkOrderStatusValue, string> = {
  Pending: 'Pendiente',
  InDiagnosis: 'En diagnóstico',
  InRepair: 'En reparación',
  Completed: 'Finalizado',
  Delivered: 'Entregado',
}

export type WorkOrder = {
  id: string
  workshopId: string
  motorcycleId: string
  orderNumber: string
  status: WorkOrderStatusValue
  description: string | null
  diagnosis: string | null
  currentMileage: number | null
  estimatedCost: number
  finalCost: number
  scheduledDate: string | null
  startedAtUtc: string | null
  completedAtUtc: string | null
  deliveredAtUtc: string | null
  createdByUserId: string
  assignedMechanicUserId: string | null
  notes: string | null
  isActive: boolean
  createdAtUtc: string
}

export type CreateWorkOrderPayload = {
  motorcycleId: string
  description: string
  currentMileage?: number
  estimatedCost: number
  scheduledDate?: string
  assignedMechanicUserId?: string
  notes?: string
}
