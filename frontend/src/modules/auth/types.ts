export type UserRole = 'Owner' | 'Mechanic' | 'Receptionist'

export type AuthUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
}

export type AuthSession = {
  accessToken: string
  accessTokenExpiresAtUtc: string
  refreshToken: string
  refreshTokenExpiresAtUtc: string
  user: AuthUser
}

export type LoginRequest = {
  email: string
  password: string
}
