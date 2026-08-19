import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Card } from '@/shared/ui/card'
import { getActiveOrgId, getActiveWorkshopId } from '@/shared/lib/active-context'
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
  const orgId = getActiveOrgId()
  const workshopId = getActiveWorkshopId()

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
        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Organizaciones</p>
          <p className="mt-1 text-2xl font-semibold">{me?.organizations.length ?? 0}</p>
          <p className="text-xs text-slate-500">donde tienes membresía activa</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Talleres</p>
          <p className="mt-1 text-2xl font-semibold">{workshopsQuery.data?.length ?? 0}</p>
          <p className="text-xs text-slate-500">en la organización activa</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Clientes</p>
          <p className="mt-1 text-2xl font-semibold">{clientsQuery.data?.length ?? 0}</p>
          <p className="text-xs text-slate-500">nivel organización · visibles desde cualquier taller</p>
        </Card>

        <Card className="p-4">
          <p className="text-xs uppercase tracking-wide text-slate-500">Repuestos</p>
          <p className="mt-1 text-2xl font-semibold">{parts.length}</p>
          <p className="text-xs text-slate-500">
            {activeWorkshop ? `en ${activeWorkshop.name}` : 'sin taller activo'}
            {lowStock > 0 ? ` · ${lowStock} bajo mínimo` : ''}
          </p>
        </Card>
      </div>
    </div>
  )
}
