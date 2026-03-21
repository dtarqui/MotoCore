import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import type { PropsWithChildren } from 'react'
import type { UserRole } from '../types'

export function ProtectedRoute() {
  const { isAuthenticated } = useAuth()
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}

type RoleRouteProps = PropsWithChildren<{
  allowedRoles: UserRole[]
}>

export function RoleRoute({ allowedRoles, children }: RoleRouteProps) {
  const { hasAnyRole } = useAuth()

  if (!hasAnyRole(allowedRoles)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}
