export type Client = {
  id: string
  workshopId: string
  firstName: string
  lastName: string
  email: string
  phone: string
  secondaryPhone: string | null
  address: string | null
  city: string | null
  postalCode: string | null
  identificationNumber: string | null
  companyName: string | null
  taxId: string | null
  birthDate: string | null
  preferredContactMethod: string | null
  notes: string | null
  isActive: boolean
  createdAtUtc: string
}

export type ClientStatistics = {
  totalClients: number
  activeClients: number
  inactiveClients: number
  newClientsThisMonth: number
  clientsWithPendingOrders: number
}

export type ClientUpsertPayload = {
  firstName: string
  lastName: string
  email: string
  phone: string
  secondaryPhone?: string
  address?: string
  city?: string
  postalCode?: string
  identificationNumber?: string
  companyName?: string
  taxId?: string
  birthDate?: string
  preferredContactMethod?: string
  notes?: string
}
