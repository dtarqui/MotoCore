import { useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { getMotorcycles } from '@/modules/motocicletas/motocicletas-api'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Card, CardContent } from '@/shared/ui/card'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/shared/ui/table'
import {
  closeWorkOrder,
  createWorkOrder,
  deliverWorkOrder,
  getWorkOrders,
  updateWorkOrderStatus,
} from '../ordenes-api'
import {
  WORK_ORDER_STATUSES,
  WORK_ORDER_STATUS_LABELS,
  type CreateWorkOrderPayload,
  type WorkOrderStatusValue,
} from '../types'

const badgeVariantByStatus: Record<WorkOrderStatusValue, 'outline' | 'secondary' | 'default'> = {
  Pending: 'outline',
  InDiagnosis: 'secondary',
  InRepair: 'secondary',
  Completed: 'secondary',
  Delivered: 'default',
}

const initialForm: CreateWorkOrderPayload = {
  motorcycleId: '',
  description: '',
  estimatedCost: 0,
  currentMileage: undefined,
  notes: '',
}

export function OrdenesPage() {
  const queryClient = useQueryClient()
  const { session, hasAnyRole } = useAuth()
  const accessToken = session?.accessToken ?? ''

  const canManageOrders = hasAnyRole(['Owner', 'Receptionist'])
  const canUpdateOrders = hasAnyRole(['Owner', 'Mechanic'])
  const canDeliverOrders = hasAnyRole(['Owner', 'Receptionist'])

  const [form, setForm] = useState<CreateWorkOrderPayload>(initialForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [finalCostByOrder, setFinalCostByOrder] = useState<Record<string, string>>({})

  const workOrdersQuery = useQuery({
    queryKey: ['work-orders'],
    queryFn: () => getWorkOrders(accessToken),
    enabled: Boolean(accessToken),
  })

  const motorcyclesQuery = useQuery({
    queryKey: ['motorcycles'],
    queryFn: () => getMotorcycles(accessToken),
    enabled: Boolean(accessToken),
  })

  const motorcycleLabelById = useMemo(() => {
    const map = new Map<string, string>()
    for (const motorcycle of motorcyclesQuery.data ?? []) {
      map.set(motorcycle.id, `${motorcycle.licensePlate} — ${motorcycle.brand} ${motorcycle.model}`)
    }
    return map
  }, [motorcyclesQuery.data])

  const createMutation = useMutation({
    mutationFn: async (payload: CreateWorkOrderPayload) => createWorkOrder(payload, accessToken),
    onSuccess: async () => {
      setForm(initialForm)
      await queryClient.invalidateQueries({ queryKey: ['work-orders'] })
    },
    onError: (error) => {
      setFormError(error instanceof Error ? error.message : 'No fue posible crear la orden.')
    },
  })

  const statusMutation = useMutation({
    mutationFn: async ({ workOrderId, status }: { workOrderId: string; status: string }) =>
      updateWorkOrderStatus(workOrderId, status, accessToken),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['work-orders'] })
    },
  })

  const closeMutation = useMutation({
    mutationFn: async ({ workOrderId, finalCost }: { workOrderId: string; finalCost: number }) =>
      closeWorkOrder(workOrderId, finalCost, undefined, accessToken),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['work-orders'] })
    },
  })

  const deliverMutation = useMutation({
    mutationFn: async (workOrderId: string) => deliverWorkOrder(workOrderId, accessToken),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['work-orders'] })
    },
  })

  const workOrders = useMemo(() => workOrdersQuery.data ?? [], [workOrdersQuery.data])

  const stateCounts = useMemo(() => {
    const counts = new Map<WorkOrderStatusValue, number>()
    for (const status of WORK_ORDER_STATUSES) {
      counts.set(status, 0)
    }
    for (const order of workOrders) {
      counts.set(order.status, (counts.get(order.status) ?? 0) + 1)
    }
    return counts
  }, [workOrders])

  function handleChange<K extends keyof CreateWorkOrderPayload>(
    field: K,
    value: CreateWorkOrderPayload[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    await createMutation.mutateAsync(form)
  }

  return (
    <section>
      <PageHeader
        title="Órdenes de Trabajo"
        description="Seguimiento operativo de servicios por motocicleta."
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        {WORK_ORDER_STATUSES.map((status) => (
          <Card key={status}>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">{stateCounts.get(status) ?? 0}</div>
                <Badge variant={badgeVariantByStatus[status]}>{WORK_ORDER_STATUS_LABELS[status]}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {canManageOrders ? (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form className="grid grid-cols-1 gap-3 md:grid-cols-4" onSubmit={handleSubmit}>
              <select
                required
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50"
                value={form.motorcycleId}
                onChange={(event) => handleChange('motorcycleId', event.target.value)}
              >
                <option value="">Seleccionar motocicleta...</option>
                {(motorcyclesQuery.data ?? []).map((motorcycle) => (
                  <option key={motorcycle.id} value={motorcycle.id}>
                    {motorcycle.licensePlate} — {motorcycle.brand} {motorcycle.model}
                  </option>
                ))}
              </select>
              <Input
                placeholder="Descripción del servicio"
                required
                className="md:col-span-2"
                value={form.description}
                onChange={(event) => handleChange('description', event.target.value)}
              />
              <Input
                placeholder="Costo estimado"
                type="number"
                min={0}
                step="0.01"
                required
                value={form.estimatedCost}
                onChange={(event) => handleChange('estimatedCost', Number(event.target.value))}
              />

              <div className="md:col-span-4">
                <Button type="submit" disabled={createMutation.isPending}>
                  Nueva orden de trabajo
                </Button>
              </div>
            </form>

            {formError ? (
              <Alert variant="destructive" className="mt-4">
                <AlertTitle>Error en la orden</AlertTitle>
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">{workOrders.length} órdenes registradas</p>
            {workOrdersQuery.isLoading ? <p className="text-sm text-muted-foreground">Cargando...</p> : null}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Orden</TableHead>
                <TableHead>Motocicleta</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Costo est.</TableHead>
                <TableHead>Costo final</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-medium">{order.orderNumber}</TableCell>
                  <TableCell>{motorcycleLabelById.get(order.motorcycleId) ?? '—'}</TableCell>
                  <TableCell>
                    {canUpdateOrders && order.status !== 'Delivered' ? (
                      <select
                        className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50"
                        value={order.status}
                        onChange={(event) =>
                          statusMutation.mutate({ workOrderId: order.id, status: event.target.value })
                        }
                      >
                        {WORK_ORDER_STATUSES.filter((status) => status !== 'Delivered').map((status) => (
                          <option key={status} value={status}>
                            {WORK_ORDER_STATUS_LABELS[status]}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <Badge variant={badgeVariantByStatus[order.status]}>
                        {WORK_ORDER_STATUS_LABELS[order.status]}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>${order.estimatedCost.toFixed(2)}</TableCell>
                  <TableCell>${order.finalCost.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2 items-center">
                      {canUpdateOrders && order.status === 'InRepair' ? (
                        <>
                          <Input
                            type="number"
                            min={0}
                            step="0.01"
                            placeholder="Costo final"
                            className="h-8 w-28"
                            value={finalCostByOrder[order.id] ?? ''}
                            onChange={(event) =>
                              setFinalCostByOrder((current) => ({
                                ...current,
                                [order.id]: event.target.value,
                              }))
                            }
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={closeMutation.isPending || !finalCostByOrder[order.id]}
                            onClick={() =>
                              closeMutation.mutate({
                                workOrderId: order.id,
                                finalCost: Number(finalCostByOrder[order.id] ?? 0),
                              })
                            }
                          >
                            Cerrar
                          </Button>
                        </>
                      ) : null}
                      {canDeliverOrders && order.status === 'Completed' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={deliverMutation.isPending}
                          onClick={() => deliverMutation.mutate(order.id)}
                        >
                          Entregar
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!workOrdersQuery.isLoading && workOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-gray-500">
                    No hay órdenes de trabajo registradas.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  )
}
