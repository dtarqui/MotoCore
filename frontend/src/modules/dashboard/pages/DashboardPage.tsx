import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { getParts } from '@/modules/inventario/inventario-api'
import { getWorkOrders } from '@/modules/ordenes/ordenes-api'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'

function isSameMonth(dateIso: string | null, reference: Date) {
  if (!dateIso) {
    return false
  }

  const date = new Date(dateIso)
  return date.getFullYear() === reference.getFullYear() && date.getMonth() === reference.getMonth()
}

export function DashboardPage() {
  const { session } = useAuth()
  const accessToken = session?.accessToken ?? ''

  const workOrdersQuery = useQuery({
    queryKey: ['work-orders'],
    queryFn: () => getWorkOrders(accessToken),
    enabled: Boolean(accessToken),
  })

  const partsQuery = useQuery({
    queryKey: ['parts'],
    queryFn: () => getParts(accessToken),
    enabled: Boolean(accessToken),
  })

  const now = useMemo(() => new Date(), [])

  const servicesThisMonth = useMemo(() => {
    const orders = workOrdersQuery.data ?? []
    return orders.filter(
      (order) =>
        (order.status === 'Completed' || order.status === 'Delivered') &&
        (isSameMonth(order.completedAtUtc, now) || isSameMonth(order.deliveredAtUtc, now)),
    ).length
  }, [workOrdersQuery.data, now])

  const revenueThisMonth = useMemo(() => {
    const orders = workOrdersQuery.data ?? []
    return orders
      .filter(
        (order) =>
          (order.status === 'Completed' || order.status === 'Delivered') &&
          (isSameMonth(order.completedAtUtc, now) || isSameMonth(order.deliveredAtUtc, now)),
      )
      .reduce((total, order) => total + order.finalCost, 0)
  }, [workOrdersQuery.data, now])

  const lowStockCount = useMemo(() => {
    const parts = partsQuery.data ?? []
    return parts.filter((part) => part.currentStock <= part.minimumStock).length
  }, [partsQuery.data])

  const isLoading = workOrdersQuery.isLoading || partsQuery.isLoading

  return (
    <section>
      <PageHeader
        title="Dashboard"
        description="Vista general de operación del taller y métricas clave."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Servicios del mes</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">Órdenes completadas</p>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{isLoading ? '—' : servicesThisMonth}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ingresos estimados</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">Mes actual</p>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {isLoading ? '—' : `$${revenueThisMonth.toFixed(2)}`}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Alertas críticas</CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400">Repuestos bajo stock</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-bold">{isLoading ? '—' : lowStockCount}</div>
              <Badge variant={lowStockCount > 0 ? 'destructive' : 'outline'}>
                {lowStockCount > 0 ? 'Atención' : 'Normal'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}
