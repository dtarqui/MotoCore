import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '../app/layouts/AppShell'
import { DashboardPage } from '../modules/dashboard/pages/DashboardPage'
import { ClientesPage } from '../modules/clientes/pages/ClientesPage'
import { OrdenesPage } from '../modules/ordenes/pages/OrdenesPage'
import { InventarioPage } from '../modules/inventario/pages/InventarioPage'
import { LoginPage } from '../modules/auth/pages/LoginPage'
import { UnauthorizedPage } from '../modules/auth/pages/UnauthorizedPage'
import { ProtectedRoute, RoleRoute } from '../modules/auth/components/ProtectedRoute'

export const appRouter = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        path: '/unauthorized',
        element: <UnauthorizedPage />,
      },
      {
        path: '/',
        element: <AppShell />,
        children: [
          {
            index: true,
            element: <DashboardPage />,
          },
          {
            path: 'clientes',
            element: (
              <RoleRoute allowedRoles={['Owner', 'Receptionist']}>
                <ClientesPage />
              </RoleRoute>
            ),
          },
          {
            path: 'ordenes',
            element: (
              <RoleRoute allowedRoles={['Owner', 'Mechanic', 'Receptionist']}>
                <OrdenesPage />
              </RoleRoute>
            ),
          },
          {
            path: 'inventario',
            element: (
              <RoleRoute allowedRoles={['Owner', 'Receptionist']}>
                <InventarioPage />
              </RoleRoute>
            ),
          },
        ],
      },
    ],
  },
])