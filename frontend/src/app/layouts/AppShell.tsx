import { NavLink, Outlet } from 'react-router-dom'
import { navigationItems } from '../../shared/config/navigation'
import { Button } from '../../shared/ui/button'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { ROLE_LABELS } from '@/modules/auth/types'
import { ContextSelectors } from '@/modules/organizaciones/ContextSelectors'
import { useActiveOrgId } from '@/shared/lib/active-context'

export function AppShell() {
  const { me, hasAnyRole, logout } = useAuth()

  const activeOrgId = useActiveOrgId()
  const activeMembership = me?.organizations.find((m) => m.organization.id === activeOrgId)
  const fullName = me?.profile ? `${me.profile.first_name} ${me.profile.last_name}`.trim() : ''

  const visibleItems = navigationItems.filter((item) => {
    if (!item.allowedRoles || item.allowedRoles.length === 0) {
      return true
    }

    return hasAnyRole(item.allowedRoles)
  })

  return (
    <div className="app-shell min-h-screen bg-white dark:bg-gray-950">
      <header className="bg-white border-b border-gray-200 px-6 py-4 dark:bg-gray-950 dark:border-gray-800">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">MotoCore</p>
            <h1 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">Sistema de Gestión para Talleres</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{fullName || me?.email}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {/* El rol es el de la organización activa, no uno global. */}
                {activeMembership ? ROLE_LABELS[activeMembership.role] : ''}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => void logout()}>
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

      {/* Franja propia para el contexto activo: separada de la identidad de
          sesión de arriba y de la navegación de abajo, para que "sobre qué
          organización/taller trabajo" no compita visualmente con ninguna de
          las dos. */}
      <div className="border-b border-gray-200 bg-gray-50/70 px-6 py-2.5 dark:border-gray-800 dark:bg-gray-900/40">
        <ContextSelectors />
      </div>

      <nav className="app-nav bg-white border-b border-gray-200 px-6 py-3 flex flex-wrap gap-2 dark:bg-gray-950 dark:border-gray-800">
        {visibleItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? 'nav-link-active' : ''
            }
            end={item.to === '/'}
          >
            {({ isActive }) => (
              <Button
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                className="h-8"
              >
                {item.label}
              </Button>
            )}
          </NavLink>
        ))}
      </nav>

      <main className="app-main max-w-6xl mx-auto px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}
