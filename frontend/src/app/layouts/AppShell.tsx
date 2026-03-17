import { NavLink, Outlet } from 'react-router-dom'
import { navigationItems } from '../../shared/config/navigation'

export function AppShell() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="brand-kicker">MotoCore</p>
          <h1 className="brand-title">Sistema de Gestión para Talleres</h1>
        </div>
      </header>

      <nav className="app-nav" aria-label="Navegación principal">
        {navigationItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              isActive ? 'nav-link nav-link-active' : 'nav-link'
            }
            end={item.to === '/'}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}