export type Motorcycle = {
  id: string
  workshopId: string
  clientId: string
  brand: string
  model: string
  year: number
  licensePlate: string
  vin: string | null
  color: string | null
  mileage: number | null
  engineSize: string | null
  notes: string | null
  isActive: boolean
  createdAtUtc: string
}

export type MotorcycleUpsertPayload = {
  clientId: string
  brand: string
  model: string
  year: number
  licensePlate: string
  vin?: string
  color?: string
  mileage?: number
  engineSize?: string
  notes?: string
}
