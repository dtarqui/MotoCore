import { NavLink, Outlet } from 'react-router-dom'
import { navigationItems } from '../../shared/config/navigation'
import { Button } from '../../shared/ui/button'
import { useAuth } from '@/modules/auth/hooks/useAuth'

export function AppShell() {
  const { session, hasAnyRole, logout } = useAuth()

  const visibleItems = navigationItems.filter((item) => {
    if (!item.allowedRoles || item.allowedRoles.length === 0) {
      return true
    }

    return hasAnyRole(item.allowedRoles)
  })

  return (
    <div className="app-shell min-h-screen bg-white dark:bg-gray-950">
      <header className="bg-white border-b border-gray-200 px-6 py-4 dark:bg-gray-950 dark:border-gray-800">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">MotoCore</p>
            <h1 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">Sistema de Gestión para Talleres</h1>
          </div>

          <div className="text-right">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
              {session?.user.firstName} {session?.user.lastName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {session?.user.role}
            </p>
            <Button
              className="mt-2"
              variant="outline"
              size="sm"
              onClick={logout}
            >
              Cerrar sesión
            </Button>
          </div>
        </div>
      </header>

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