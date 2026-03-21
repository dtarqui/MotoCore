import { createContext } from 'react'
import type { AuthSession, UserRole } from './types'

export type AuthContextValue = {
  session: AuthSession | null
  isAuthenticated: boolean
  isLoggingIn: boolean
  isRegistering: boolean
  login: (email: string, password: string) => Promise<void>
  register: (payload: {
    email: string
    password: string
    firstName: string
    lastName: string
    role: 'Owner'
    workshopName: string
  }) => Promise<void>
  logout: () => void
  hasAnyRole: (roles: UserRole[]) => boolean
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
