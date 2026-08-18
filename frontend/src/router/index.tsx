import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '../app/layouts/AppShell'
import { DashboardPage } from '../modules/dashboard/pages/DashboardPage'
import { ClientesPage } from '../modules/clientes/pages/ClientesPage'
import { InventarioPage } from '../modules/inventario/pages/InventarioPage'
import { SucursalesPage } from '../modules/organizaciones/pages/SucursalesPage'
import { EquipoPage } from '../modules/organizaciones/pages/EquipoPage'
import { AuditoriaPage } from '../modules/auditoria/pages/AuditoriaPage'
import { LoginPage } from '../modules/auth/pages/LoginPage'
import { RegisterPage } from '../modules/auth/pages/RegisterPage'
import { UnauthorizedPage } from '../modules/auth/pages/UnauthorizedPage'
import { ProtectedRoute, RoleRoute } from '../modules/auth/components/ProtectedRoute'

/**
 * Rutas del alcance construido. Los módulos de motocicletas, órdenes e
 * historial conservan su interfaz en el repositorio pero todavía no tienen
 * endpoints en el backend nuevo, así que no se exponen como ruta: una pantalla
 * accesible que falla al cargar es peor que una que aún no está.
 */
export const appRouter = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/register',
    element: <RegisterPage />,
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
              // El Mechanic consulta clientes aunque no pueda editarlos (RF-505).
              <RoleRoute allowedRoles={['owner', 'mechanic', 'receptionist']}>
                <ClientesPage />
              </RoleRoute>
            ),
          },
          {
            path: 'inventario',
            element: (
              <RoleRoute allowedRoles={['owner', 'mechanic', 'receptionist']}>
                <InventarioPage />
              </RoleRoute>
            ),
          },
          {
            path: 'sucursales',
            element: (
              <RoleRoute allowedRoles={['owner', 'mechanic', 'receptionist']}>
                <SucursalesPage />
              </RoleRoute>
            ),
          },
          {
            path: 'equipo',
            element: (
              <RoleRoute allowedRoles={['owner', 'mechanic', 'receptionist']}>
                <EquipoPage />
              </RoleRoute>
            ),
          },
          {
            path: 'auditoria',
            element: (
              // Única ruta reservada al Owner (RF-704). La restricción real la
              // aplican la API y la política de la base de datos; esto solo
              // evita mostrar una pantalla que fallaría al cargar.
              <RoleRoute allowedRoles={['owner']}>
                <AuditoriaPage />
              </RoleRoute>
            ),
          },
        ],
      },
    ],
  },
])
