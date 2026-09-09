import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { PropsWithChildren } from 'react'
import type { UserRole } from '../types'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()
  const location = useLocation()

  // Mientras se restaura la sesión guardada no se sabe aún si hay usuario.
  // Sin esta espera, recargar una página protegida rebotaría al login.
  if (isLoading) {
    return <p className="p-6 text-sm text-gray-500">Cargando…</p>
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

type RoleRouteProps = PropsWithChildren<{
  allowedRoles: UserRole[]
}>

/** Autoriza por el rol en la **organización activa**, no por un rol global. */
export function RoleRoute({ allowedRoles, children }: RoleRouteProps) {
  const { hasAnyRole, me } = useAuth()

  // El perfil llega tras autenticarse; sin él aún no se conoce el rol.
  if (!me) {
    return <p className="p-6 text-sm text-gray-500">Cargando…</p>
  }

  if (!hasAnyRole(allowedRoles)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}
