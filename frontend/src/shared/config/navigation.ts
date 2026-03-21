import type { UserRole } from '@/modules/auth/types'

type NavigationItem = {
  to: string
  label: string
  allowedRoles?: UserRole[]
}

export const navigationItems: NavigationItem[] = [
  { to: '/', label: 'Dashboard' },
  {
    to: '/clientes',
    label: 'Clientes',
    allowedRoles: ['Owner', 'Receptionist'],
  },
  {
    to: '/ordenes',
    label: 'Órdenes',
    allowedRoles: ['Owner', 'Mechanic', 'Receptionist'],
  },
  {
    to: '/inventario',
    label: 'Inventario',
    allowedRoles: ['Owner', 'Receptionist'],
  },
]