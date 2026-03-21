import { useCallback, useMemo, useState, type PropsWithChildren } from 'react'
import { clearStoredSession, loadStoredSession, storeSession } from './auth-storage'
import { loginRequest } from './auth-api'
import type { AuthSession, UserRole } from './types'
import { AuthContext, type AuthContextValue } from './auth-context'

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AuthSession | null>(() => loadStoredSession())
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  const login = useCallback(async (email: string, password: string) => {
    setIsLoggingIn(true)
    try {
      const nextSession = await loginRequest({ email, password })
      storeSession(nextSession)
      setSession(nextSession)
    } finally {
      setIsLoggingIn(false)
    }
  }, [])

  const logout = useCallback(() => {
    clearStoredSession()
    setSession(null)
  }, [])

  const hasAnyRole = useCallback(
    (roles: UserRole[]) => {
      if (!session) {
        return false
      }

      return roles.includes(session.user.role)
    },
    [session],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      isLoggingIn,
      login,
      logout,
      hasAnyRole,
    }),
    [hasAnyRole, isLoggingIn, login, logout, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
