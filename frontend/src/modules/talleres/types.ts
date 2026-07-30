export type Workshop = {
  id: string
  name: string
  description: string | null
  address: string | null
  phoneNumber: string | null
  email: string | null
  ownerId: string
  isActive: boolean
  createdAtUtc: string
}

export type WorkshopMember = {
  id: string
  userId: string
  email: string
  firstName: string
  lastName: string
  role: string
  isActive: boolean
  joinedAtUtc: string
}

export type UpdateWorkshopPayload = {
  name: string
  description?: string
  address?: string
  phoneNumber?: string
  email?: string
}

export type InviteMemberPayload = {
  email: string
  role: string
}
