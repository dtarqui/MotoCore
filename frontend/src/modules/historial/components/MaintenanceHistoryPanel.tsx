import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Alert, AlertDescription, AlertTitle } from '@/shared/ui/alert'
import { createMaintenanceHistoryEntry, getMotorcycleHistory } from '../historial-api'

type HistoryFormState = {
  title: string
  description: string
  totalCost: number
  serviceDate: string
  mileageAtService?: number
}

type Props = {
  motorcycleId: string
  motorcycleLabel: string
  accessToken: string
  onClose: () => void
}

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

const initialForm: HistoryFormState = {
  title: '',
  description: '',
  totalCost: 0,
  serviceDate: todayIso(),
}

export function MaintenanceHistoryPanel({ motorcycleId, motorcycleLabel, accessToken, onClose }: Props) {
  const queryClient = useQueryClient()
  const [form, setForm] = useState<HistoryFormState>(initialForm)
  const [formError, setFormError] = useState<string | null>(null)

  const historyQuery = useQuery({
    queryKey: ['maintenance-history', motorcycleId],
    queryFn: () => getMotorcycleHistory(motorcycleId, accessToken),
    enabled: Boolean(accessToken) && Boolean(motorcycleId),
  })

  const createMutation = useMutation({
    mutationFn: async () =>
      createMaintenanceHistoryEntry({ motorcycleId, ...form }, accessToken),
    onSuccess: async () => {
      setForm(initialForm)
      await queryClient.invalidateQueries({ queryKey: ['maintenance-history', motorcycleId] })
    },
    onError: (error) => {
      setFormError(error instanceof Error ? error.message : 'No fue posible registrar el servicio.')
    },
  })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    await createMutation.mutateAsync()
  }

  const entries = historyQuery.data ?? []

  return (
    <Card className="mt-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-lg">Historial de mantenimiento — {motorcycleLabel}</CardTitle>
        <Button variant="outline" size="sm" onClick={onClose}>
          Cerrar
        </Button>
      </CardHeader>
      <CardContent>
        <form className="grid grid-cols-1 gap-3 mb-6 md:grid-cols-4" onSubmit={handleSubmit}>
          <Input
            placeholder="Título"
            required
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          />
          <Input
            placeholder="Descripción"
            required
            className="md:col-span-2"
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          />
          <Input
            type="date"
            required
            value={form.serviceDate}
            onChange={(event) => setForm((current) => ({ ...current, serviceDate: event.target.value }))}
          />
          <Input
            placeholder="Kilometraje"
            type="number"
            value={form.mileageAtService ?? ''}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                mileageAtService: event.target.value ? Number(event.target.value) : undefined,
              }))
            }
          />
          <Input
            placeholder="Costo total"
            type="number"
            min={0}
            step="0.01"
            required
            value={form.totalCost}
            onChange={(event) =>
              setForm((current) => ({ ...current, totalCost: Number(event.target.value) }))
            }
          />

          <div className="md:col-span-4">
            <Button type="submit" disabled={createMutation.isPending}>
              Registrar servicio
            </Button>
          </div>
        </form>

        {formError ? (
          <Alert variant="destructive" className="mb-4">
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{formError}</AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-3">
          {entries.map((entry) => (
            <div key={entry.id} className="p-3 border rounded-lg">
              <div className="flex justify-between items-baseline">
                <p className="font-medium text-sm">{entry.title}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(entry.serviceDate).toLocaleDateString()}
                </p>
              </div>
              <p className="text-sm text-muted-foreground">{entry.description}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Costo: ${entry.totalCost.toFixed(2)}
                {entry.mileageAtService ? ` · Kilometraje: ${entry.mileageAtService}` : ''}
              </p>
            </div>
          ))}
          {!historyQuery.isLoading && entries.length === 0 ? (
            <p className="text-sm text-gray-500">Sin registros de mantenimiento.</p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
