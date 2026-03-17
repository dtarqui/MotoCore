import { createBrowserRouter } from 'react-router-dom'
import { AppShell } from '../app/layouts/AppShell'
import { DashboardPage } from '../modules/dashboard/pages/DashboardPage'
import { ClientesPage } from '../modules/clientes/pages/ClientesPage'
import { OrdenesPage } from '../modules/ordenes/pages/OrdenesPage'
import { InventarioPage } from '../modules/inventario/pages/InventarioPage'

export const appRouter = createBrowserRouter([
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
        element: <ClientesPage />,
      },
      {
        path: 'ordenes',
        element: <OrdenesPage />,
      },
      {
        path: 'inventario',
        element: <InventarioPage />,
      },
    ],
  },
])