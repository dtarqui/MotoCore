import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '../app/layouts/AppShell'
import { DashboardPage } from '../modules/dashboard/pages/DashboardPage'
import { ClientesPage } from '../modules/clientes/pages/ClientesPage'
import { InventarioPage } from '../modules/inventario/pages/InventarioPage'
import { TalleresPage } from '../modules/organizaciones/pages/TalleresPage'
import { EquipoPage } from '../modules/organizaciones/pages/EquipoPage'
import { AuditoriaPage } from '../modules/auditoria/pages/AuditoriaPage'
import { ArquitecturaPage } from '../modules/arquitectura/pages/ArquitecturaPage'
import { LoginPage } from '../modules/auth/pages/LoginPage'
import { RegisterPage } from '../modules/auth/pages/RegisterPage'
import { UnauthorizedPage } from '../modules/auth/pages/UnauthorizedPage'
import { ProtectedRoute, RoleRoute } from '../modules/auth/components/ProtectedRoute'

/**
 * Rutas del alcance construido: el corte vertical —clientes e inventario— más
 * la administración de la jerarquía y la auditoría.
 *
 * Motocicletas, órdenes de trabajo e historial de mantenimiento **no están**:
 * quedan fuera del alcance del proyecto de grado (RF-800) y se incorporarán
 * reutilizando este mismo patrón cuando tengan su módulo en la interfaz de
 * programación.
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
    // Fuera de ProtectedRoute a propósito: son diagramas para presentar el
    // proyecto, no datos de negocio, y deben abrirse sin depender de una
    // sesión iniciada.
    path: '/arquitectura',
    element: <ArquitecturaPage />,
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
            path: 'talleres',
            element: (
              <RoleRoute allowedRoles={['owner', 'mechanic', 'receptionist']}>
                <TalleresPage />
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
