import { useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { getClients } from '@/modules/clientes/clientes-api'
import { MaintenanceHistoryPanel } from '@/modules/historial/components/MaintenanceHistoryPanel'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Card, CardContent } from '@/shared/ui/card'
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
  createMotorcycle,
  deleteMotorcycle,
  getMotorcycles,
  updateMotorcycle,
} from '../motocicletas-api'
import type { MotorcycleUpsertPayload } from '../types'

const initialForm: MotorcycleUpsertPayload = {
  clientId: '',
  brand: '',
  model: '',
  year: new Date().getFullYear(),
  licensePlate: '',
  vin: '',
  color: '',
  mileage: undefined,
  engineSize: '',
  notes: '',
}

export function MotocicletasPage() {
  const queryClient = useQueryClient()
  const { session, hasAnyRole } = useAuth()
  const accessToken = session?.accessToken ?? ''
  const canManageMotorcycles = hasAnyRole(['Owner', 'Receptionist'])

  const [form, setForm] = useState<MotorcycleUpsertPayload>(initialForm)
  const [editingMotorcycleId, setEditingMotorcycleId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)
  const [historyMotorcycleId, setHistoryMotorcycleId] = useState<string | null>(null)

  const motorcyclesQuery = useQuery({
    queryKey: ['motorcycles'],
    queryFn: () => getMotorcycles(accessToken),
    enabled: Boolean(accessToken),
  })

  const clientsQuery = useQuery({
    queryKey: ['clients'],
    queryFn: () => getClients(accessToken),
    enabled: Boolean(accessToken),
  })

  const clientNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const client of clientsQuery.data ?? []) {
      map.set(client.id, `${client.firstName} ${client.lastName}`)
    }
    return map
  }, [clientsQuery.data])

  const upsertMutation = useMutation({
    mutationFn: async (payload: MotorcycleUpsertPayload) => {
      if (editingMotorcycleId) {
        return updateMotorcycle(editingMotorcycleId, payload, accessToken)
      }

      return createMotorcycle(payload, accessToken)
    },
    onSuccess: async () => {
      setForm(initialForm)
      setEditingMotorcycleId(null)
      await queryClient.invalidateQueries({ queryKey: ['motorcycles'] })
    },
    onError: (error) => {
      setFormError(error instanceof Error ? error.message : 'No fue posible guardar la motocicleta.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (motorcycleId: string) => {
      return deleteMotorcycle(motorcycleId, accessToken)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['motorcycles'] })
    },
  })

  const motorcycles = useMemo(() => motorcyclesQuery.data ?? [], [motorcyclesQuery.data])
  const clients = useMemo(() => clientsQuery.data ?? [], [clientsQuery.data])

  function handleChange<K extends keyof MotorcycleUpsertPayload>(
    field: K,
    value: MotorcycleUpsertPayload[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleEdit(motorcycleId: string) {
    const motorcycle = motorcycles.find((item) => item.id === motorcycleId)

    if (!motorcycle) {
      return
    }

    setEditingMotorcycleId(motorcycleId)
    setFormError(null)
    setForm({
      clientId: motorcycle.clientId,
      brand: motorcycle.brand,
      model: motorcycle.model,
      year: motorcycle.year,
      licensePlate: motorcycle.licensePlate,
      vin: motorcycle.vin ?? '',
      color: motorcycle.color ?? '',
      mileage: motorcycle.mileage ?? undefined,
      engineSize: motorcycle.engineSize ?? '',
      notes: motorcycle.notes ?? '',
    })
  }

  function handleCancelEdit() {
    setEditingMotorcycleId(null)
    setFormError(null)
    setForm(initialForm)
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    await upsertMutation.mutateAsync(form)
  }

  return (
    <section>
      <PageHeader
        title="Motocicletas"
        description="Registro de motocicletas por cliente y su información técnica."
      />

      <Card>
        <CardContent className="pt-6">
          {canManageMotorcycles ? (
            <form className="grid grid-cols-1 gap-3 mb-6 md:grid-cols-3" onSubmit={handleSubmit}>
              <select
                required
                className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50"
                value={form.clientId}
                onChange={(event) => handleChange('clientId', event.target.value)}
                disabled={Boolean(editingMotorcycleId)}
              >
                <option value="">Seleccionar cliente...</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.firstName} {client.lastName}
                  </option>
                ))}
              </select>
              <Input
                placeholder="Marca"
                required
                value={form.brand}
                onChange={(event) => handleChange('brand', event.target.value)}
              />
              <Input
                placeholder="Modelo"
                required
                value={form.model}
                onChange={(event) => handleChange('model', event.target.value)}
              />
              <Input
                placeholder="Año"
                type="number"
                required
                value={form.year}
                onChange={(event) => handleChange('year', Number(event.target.value))}
              />
              <Input
                placeholder="Placa"
                required
                value={form.licensePlate}
                onChange={(event) => handleChange('licensePlate', event.target.value)}
              />
              <Input
                placeholder="Kilometraje"
                type="number"
                value={form.mileage ?? ''}
                onChange={(event) =>
                  handleChange('mileage', event.target.value ? Number(event.target.value) : undefined)
                }
              />
              <Input
                placeholder="Color"
                value={form.color}
                onChange={(event) => handleChange('color', event.target.value)}
              />
              <Input
                placeholder="Cilindrada"
                value={form.engineSize}
                onChange={(event) => handleChange('engineSize', event.target.value)}
              />
              <Input
                placeholder="VIN / Chasis"
                value={form.vin}
                onChange={(event) => handleChange('vin', event.target.value)}
              />

              <div className="md:col-span-3 flex gap-2">
                <Button type="submit" disabled={upsertMutation.isPending}>
                  {editingMotorcycleId ? 'Guardar cambios' : 'Nueva motocicleta'}
                </Button>
                {editingMotorcycleId ? (
                  <Button type="button" variant="outline" onClick={handleCancelEdit}>
                    Cancelar
                  </Button>
                ) : null}
              </div>
            </form>
          ) : null}

          {formError ? (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error en motocicleta</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              {motorcycles.length} motocicletas registradas
            </p>
            {motorcyclesQuery.isLoading ? <p className="text-sm text-muted-foreground">Cargando...</p> : null}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Placa</TableHead>
                <TableHead>Marca / Modelo</TableHead>
                <TableHead>Año</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Kilometraje</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {motorcycles.map((motorcycle) => (
                <TableRow key={motorcycle.id}>
                  <TableCell className="font-medium">{motorcycle.licensePlate}</TableCell>
                  <TableCell>{motorcycle.brand} {motorcycle.model}</TableCell>
                  <TableCell>{motorcycle.year}</TableCell>
                  <TableCell>{clientNameById.get(motorcycle.clientId) ?? '—'}</TableCell>
                  <TableCell>{motorcycle.mileage ?? '—'}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setHistoryMotorcycleId((current) =>
                          current === motorcycle.id ? null : motorcycle.id,
                        )
                      }
                    >
                      Historial
                    </Button>
                    {canManageMotorcycles ? (
                      <Button variant="outline" size="sm" onClick={() => handleEdit(motorcycle.id)}>
                        Editar
                      </Button>
                    ) : null}
                    {hasAnyRole(['Owner']) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(motorcycle.id)}
                        disabled={deleteMutation.isPending}
                      >
                        Eliminar
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
              {!motorcyclesQuery.isLoading && motorcycles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-gray-500">
                    No hay motocicletas registradas.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {historyMotorcycleId ? (
        <MaintenanceHistoryPanel
          motorcycleId={historyMotorcycleId}
          motorcycleLabel={
            motorcycles.find((item) => item.id === historyMotorcycleId)?.licensePlate ?? ''
          }
          accessToken={accessToken}
          onClose={() => setHistoryMotorcycleId(null)}
        />
      ) : null}
    </section>
  )
}
