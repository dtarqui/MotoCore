import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Alert } from '@/shared/ui/alert'
import { Badge } from '@/shared/ui/badge'
import { getActiveOrgId } from '@/shared/lib/active-context'
import { createWorkshop, deactivateWorkshop, getWorkshops } from '../organizaciones-api'

/** Sucursales de la empresa activa (HU-06 · RF-301, RF-302, RF-305). */
export function SucursalesPage() {
  const { hasAnyRole } = useAuth()
  const queryClient = useQueryClient()
  const orgId = getActiveOrgId()

  const isOwner = hasAnyRole(['owner'])
  const [form, setForm] = useState({ name: '', address: '', phone: '' })
  const [error, setError] = useState<string | null>(null)

  const workshopsQuery = useQuery({
    queryKey: ['workshops', orgId],
    queryFn: () => getWorkshops(orgId!),
    enabled: Boolean(orgId),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['workshops'] })

  const createMutation = useMutation({
    mutationFn: () =>
      createWorkshop(orgId!, {
        name: form.name,
        address: form.address || undefined,
        phone: form.phone || undefined,
      }),
    onSuccess: async () => {
      setForm({ name: '', address: '', phone: '' })
      setError(null)
      await invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  const deactivateMutation = useMutation({
    mutationFn: (workshopId: string) => deactivateWorkshop(orgId!, workshopId),
    onSuccess: invalidate,
    onError: (err: Error) => setError(err.message),
  })

  const workshops = workshopsQuery.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sucursales"
        description="Locales de la empresa. La sucursal indica dónde ocurre una operación; no restringe quién puede verla."
      />

      {error ? <Alert variant="destructive">{error}</Alert> : null}

      {isOwner ? (
        <form
          className="grid gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault()
            createMutation.mutate()
          }}
        >
          <h2 className="sm:col-span-3 text-sm font-semibold text-slate-700">Nueva sucursal</h2>
          <Input
            required
            placeholder="Nombre (único en la empresa)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            placeholder="Dirección"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <Input
            placeholder="Teléfono"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          <div className="sm:col-span-3">
            <Button type="submit" disabled={createMutation.isPending}>
              Crear sucursal
            </Button>
          </div>
        </form>
      ) : (
        <Alert>Solo el Propietario puede administrar las sucursales de la empresa.</Alert>
      )}

      {workshopsQuery.isLoading ? (
        <p className="text-sm text-slate-500">Cargando sucursales…</p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200">
          {workshops.map((workshop) => (
            <li key={workshop.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
              <div>
                <p className="font-medium text-slate-800">
                  {workshop.name}{' '}
                  {workshop.is_active ? null : <Badge variant="secondary">Inactiva</Badge>}
                </p>
                <p className="text-xs text-slate-500">
                  {[workshop.address, workshop.phone].filter(Boolean).join(' · ') || '—'}
                </p>
              </div>
              {isOwner && workshop.is_active ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deactivateMutation.mutate(workshop.id)}
                >
                  Desactivar
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
