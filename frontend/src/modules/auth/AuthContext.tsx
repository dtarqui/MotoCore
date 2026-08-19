import { useCallback, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/shared/lib/supabase'
import {
  clearActiveContext,
  getActiveOrgId,
  setActiveOrgId,
} from '@/shared/lib/active-context'
import { fetchMe, registerRequest } from './auth-api'
import type { MeResponse, RegisterRequest, UserRole } from './types'
import { AuthContext, type AuthContextValue } from './auth-context'

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null)
  const [me, setMe] = useState<MeResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [isRegistering, setIsRegistering] = useState(false)

  const loadMe = useCallback(async () => {
    const profile = await fetchMe()
    setMe(profile)

    // Si no hay organización activa, o la guardada ya no corresponde a una membresía
    // vigente (por ejemplo, tras ser removido), se selecciona la primera.
    const current = getActiveOrgId()
    const stillValid = current && profile.organizations.some((m) => m.organization.id === current)
    if (!stillValid) {
      setActiveOrgId(profile.organizations[0]?.organization.id ?? null)
    }
    return profile
  }, [])

  // Restaura la sesión al arrancar y se mantiene al día con Supabase, que
  // renueva el token por su cuenta (RF-102).
  useEffect(() => {
    let active = true

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!active) return
        setSession(data.session)
        if (data.session) await loadMe().catch(() => setMe(null))
      })
      .finally(() => {
        if (active) setIsLoading(false)
      })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      if (!nextSession) {
        setMe(null)
        clearActiveContext()
      }
    })

    return () => {
      active = false
      listener.subscription.unsubscribe()
    }
  }, [loadMe])

  const login = useCallback(
    async (email: string, password: string) => {
      setIsLoggingIn(true)
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw new Error(error.message)
        await loadMe()
      } finally {
        setIsLoggingIn(false)
      }
    },
    [loadMe],
  )

  const register = useCallback(
    async (payload: RegisterRequest) => {
      setIsRegistering(true)
      try {
        // La API crea la cuenta y su estructura inicial; el inicio de sesión
        // se hace después, contra Supabase, como cualquier otro.
        await registerRequest(payload)
        const { error } = await supabase.auth.signInWithPassword({
          email: payload.email,
          password: payload.password,
        })
        if (error) throw new Error(error.message)
        await loadMe()
      } finally {
        setIsRegistering(false)
      }
    },
    [loadMe],
  )

  const logout = useCallback(async () => {
    await supabase.auth.signOut()
    setMe(null)
    clearActiveContext()
  }, [])

  const hasAnyRole = useCallback(
    (roles: UserRole[]) => {
      const orgId = getActiveOrgId()
      if (!me || !orgId) return false
      const membership = me.organizations.find((m) => m.organization.id === orgId)
      return membership ? roles.includes(membership.role) : false
    },
    [me],
  )

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      me,
      isAuthenticated: Boolean(session),
      isLoading,
      isLoggingIn,
      isRegistering,
      login,
      register,
      logout,
      reloadMe: async () => {
        await loadMe()
      },
      hasAnyRole,
    }),
    [session, me, isLoading, isLoggingIn, isRegistering, login, register, logout, loadMe, hasAnyRole],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
