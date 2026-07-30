export type MaintenanceHistoryEntry = {
  id: string
  workshopId: string
  motorcycleId: string
  clientId: string
  workOrderId: string | null
  title: string
  description: string
  mileageAtService: number | null
  totalCost: number
  serviceDate: string
  performedByUserId: string
  servicesPerformed: string | null
  partsUsed: string | null
  recommendations: string | null
  notes: string | null
  createdAtUtc: string
}

export type CreateMaintenanceHistoryEntryPayload = {
  motorcycleId: string
  title: string
  description: string
  mileageAtService?: number
  totalCost: number
  serviceDate: string
  servicesPerformed?: string
  partsUsed?: string
  recommendations?: string
  notes?: string
}
