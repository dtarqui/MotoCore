import type { UserRole } from '@/modules/auth/types'

type NavigationItem = {
  to: string
  label: string
  allowedRoles?: UserRole[]
}

/**
 * Navegación del alcance construido: el corte vertical (clientes e inventario)
 * más la administración de la jerarquía (talleres y equipo) y la auditoría.
 *
 * Los módulos de RF-800 —motocicletas, órdenes e historial— no figuran: están
 * fuera del alcance del proyecto de grado.
 */
export const navigationItems: NavigationItem[] = [
  { to: '/', label: 'Inicio' },
  {
    to: '/clientes',
    label: 'Clientes',
    // El Mechanic los consulta aunque no pueda editarlos (RF-505).
    allowedRoles: ['owner', 'mechanic', 'receptionist'],
  },
  {
    to: '/inventario',
    label: 'Inventario',
    allowedRoles: ['owner', 'mechanic', 'receptionist'],
  },
  {
    to: '/talleres',
    label: 'Talleres',
    allowedRoles: ['owner', 'mechanic', 'receptionist'],
  },
  {
    to: '/equipo',
    label: 'Equipo',
    allowedRoles: ['owner', 'mechanic', 'receptionist'],
  },
  {
    // Único elemento reservado al Owner (RF-704).
    to: '/auditoria',
    label: 'Auditoría',
    allowedRoles: ['owner'],
  },
]

/**
 * Los diagramas de arquitectura (`/arquitectura`) NO están aquí: son de
 * acceso público, para quien todavía no tiene cuenta, así que su enlace vive
 * en `LoginPage`, no en el menú de la aplicación autenticada.
 */
