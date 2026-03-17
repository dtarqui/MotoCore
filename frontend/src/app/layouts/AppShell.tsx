import { NavLink, Outlet } from 'react-router-dom'
import { navigationItems } from '../../shared/config/navigation'
import { Button } from '../../shared/ui/button'

export function AppShell() {
  return (
    <div className="app-shell min-h-screen bg-white dark:bg-gray-950">
      <header className="bg-white border-b border-gray-200 px-6 py-4 dark:bg-gray-950 dark:border-gray-800">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">MotoCore</p>
          <h1 className="text-2xl font-bold mt-1 text-gray-900 dark:text-white">Sistema de Gestión para Talleres</h1>
        </div>
      </header>

      <nav className="app-nav bg-white border-b border-gray-200 px-6 py-3 flex flex-wrap gap-2 dark:bg-gray-950 dark:border-gray-800">
        {navigationItems.map((item) => (
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