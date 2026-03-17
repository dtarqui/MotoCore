type NavigationItem = {
  to: string
  label: string
}

export const navigationItems: NavigationItem[] = [
  { to: '/', label: 'Dashboard' },
  { to: '/clientes', label: 'Clientes' },
  { to: '/ordenes', label: 'Órdenes' },
  { to: '/inventario', label: 'Inventario' },
]