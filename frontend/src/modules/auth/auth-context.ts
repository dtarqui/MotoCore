import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { MeResponse, RegisterRequest, UserRole } from './types'

export type AuthContextValue = {
  /** Sesión de Supabase. `null` mientras no haya inicio de sesión. */
  session: Session | null
  /** Perfil y organizaciones del usuario; se carga tras autenticarse. */
  me: MeResponse | null
  isAuthenticated: boolean
  /** `true` mientras se restaura la sesión al arrancar: evita parpadear al login. */
  isLoading: boolean
  isLoggingIn: boolean
  isRegistering: boolean
  login: (email: string, password: string) => Promise<void>
  register: (payload: RegisterRequest) => Promise<void>
  logout: () => Promise<void>
  reloadMe: () => Promise<void>
  /**
   * Comprueba el rol **en la organización activa**. El rol no es global: la misma
   * cuenta puede ser propietaria en una organización y mecánica en otra.
   */
  hasAnyRole: (roles: UserRole[]) => boolean
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)
