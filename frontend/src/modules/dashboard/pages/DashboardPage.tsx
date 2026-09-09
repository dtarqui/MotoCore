import { useQuery } from '@tanstack/react-query'
import { Building2, Package, Users, Wrench } from 'lucide-react'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { PageHeader } from '@/shared/ui/PageHeader'
import { StatCard } from '@/shared/ui/stat-card'
import { Badge } from '@/shared/ui/badge'
import { useActiveOrgId, useActiveWorkshopId } from '@/shared/lib/active-context'
import { ROLE_LABELS } from '@/modules/auth/types'
import { getWorkshops } from '@/modules/organizaciones/organizaciones-api'
import { getClients } from '@/modules/clientes/clientes-api'
import { getParts } from '@/modules/inventario/inventario-api'

/**
 * Inicio: resumen del contexto activo. Muestra a la vez un dato de nivel
 * organización (clientes) y uno de nivel taller (inventario), que es la forma más
 * directa de ver la diferencia entre ambos niveles.
 */
export function DashboardPage() {
  const { me } = useAuth()
  const orgId = useActiveOrgId()
  const workshopId = useActiveWorkshopId()

  const membership = me?.organizations.find((m) => m.organization.id === orgId)

  const workshopsQuery = useQuery({
    queryKey: ['workshops', orgId],
    queryFn: () => getWorkshops(),
    enabled: Boolean(orgId),
  })

  const clientsQuery = useQuery({
    queryKey: ['clients', ''],
    queryFn: () => getClients(),
    enabled: Boolean(orgId),
  })

  const partsQuery = useQuery({
    queryKey: ['parts', workshopId, false],
    queryFn: () => getParts(),
    enabled: Boolean(workshopId),
  })

  const parts = partsQuery.data ?? []
  const lowStock = parts.filter((p) => p.current_stock <= p.minimum_stock).length
  const activeWorkshop = (workshopsQuery.data ?? []).find((w) => w.id === workshopId)

  return (
    <div className="space-y-6">
      <PageHeader
        title={membership?.organization.name ?? 'MotoCore'}
        description={
          membership
            ? `Tu rol en esta organización: ${ROLE_LABELS[membership.role]}`
            : 'Selecciona una organización para comenzar.'
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Organizaciones"
          value={me?.organizations.length ?? 0}
          helper="donde tienes membresía activa"
          icon={Building2}
        />

        <StatCard
          label="Talleres"
          value={workshopsQuery.data?.length ?? 0}
          helper="en la organización activa"
          icon={Wrench}
          isLoading={workshopsQuery.isLoading}
        />

        <StatCard
          label="Clientes"
          value={clientsQuery.data?.length ?? 0}
          helper="nivel organización · visibles desde cualquier taller"
          icon={Users}
          isLoading={clientsQuery.isLoading}
        />

        <StatCard
          label="Repuestos"
          value={parts.length}
          icon={Package}
          isLoading={partsQuery.isLoading}
          helper={
            <>
              <span>{activeWorkshop ? `en ${activeWorkshop.name}` : 'sin taller activo'}</span>
              {lowStock > 0 ? <Badge variant="warning">{lowStock} bajo mínimo</Badge> : null}
            </>
          }
        />
      </div>
    </div>
  )
}
