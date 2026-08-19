import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Alert } from '@/shared/ui/alert'
import { Badge } from '@/shared/ui/badge'
import { getActiveWorkshopId } from '@/shared/lib/active-context'
import { createMovement, createPart, getMovements, getParts } from '../inventario-api'
import { MOVEMENT_LABELS, MOVEMENT_TYPES, type MovementType, type Part } from '../types'

/**
 * Inventario — nivel taller. Solo muestra los repuestos de el taller
 * activo: cambiar de taller cambia por completo el listado (RF-602).
 */
export function InventarioPage() {
  const { hasAnyRole } = useAuth()
  const queryClient = useQueryClient()

  const canManageCatalog = hasAnyRole(['owner', 'receptionist'])
  const activeWorkshopId = getActiveWorkshopId()

  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [selected, setSelected] = useState<Part | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [newPart, setNewPart] = useState({ partNumber: '', name: '', initialStock: '0', minimumStock: '0' })
  const [movement, setMovement] = useState<{ movementType: MovementType; quantity: string }>({
    movementType: 'purchase',
    quantity: '1',
  })

  const partsQuery = useQuery({
    queryKey: ['parts', activeWorkshopId, lowStockOnly],
    queryFn: () => getParts({ lowStock: lowStockOnly }),
    enabled: Boolean(activeWorkshopId),
  })

  const movementsQuery = useQuery({
    queryKey: ['movements', selected?.id],
    queryFn: () => getMovements(selected!.id),
    enabled: Boolean(selected),
  })

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['parts'] })
    await queryClient.invalidateQueries({ queryKey: ['movements'] })
  }

  const createPartMutation = useMutation({
    mutationFn: () =>
      createPart({
        partNumber: newPart.partNumber,
        name: newPart.name,
        initialStock: Number(newPart.initialStock) || 0,
        minimumStock: Number(newPart.minimumStock) || 0,
      }),
    onSuccess: async () => {
      setNewPart({ partNumber: '', name: '', initialStock: '0', minimumStock: '0' })
      setError(null)
      await refresh()
    },
    onError: (err: Error) => setError(err.message),
  })

  const movementMutation = useMutation({
    mutationFn: () =>
      createMovement(selected!.id, {
        movementType: movement.movementType,
        quantity: Number(movement.quantity) || 0,
      }),
    onSuccess: async () => {
      setError(null)
      await refresh()
      // La existencia cambió: se recarga el repuesto seleccionado.
      const fresh = await getParts()
      setSelected(fresh.find((p) => p.id === selected?.id) ?? null)
    },
    onError: (err: Error) => setError(err.message),
  })

  if (!activeWorkshopId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Inventario" description="Existencias de el taller activo." />
        <Alert>
          Selecciona un taller para ver su inventario. Las existencias son propias de cada local.
        </Alert>
      </div>
    )
  }

  const parts = partsQuery.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventario"
        description="Cada taller tiene sus propias existencias. El mismo número de parte puede existir en varias."
      />

      {error ? <Alert variant="destructive">{error}</Alert> : null}

      <label className="flex items-center gap-2 text-sm text-slate-600">
        <input
          type="checkbox"
          checked={lowStockOnly}
          onChange={(event) => setLowStockOnly(event.target.checked)}
        />
        Mostrar solo repuestos en o por debajo del mínimo
      </label>

      {canManageCatalog ? (
        <form
          className="grid gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-4"
          onSubmit={(event) => {
            event.preventDefault()
            createPartMutation.mutate()
          }}
        >
          <h2 className="sm:col-span-4 text-sm font-semibold text-slate-700">Nuevo repuesto</h2>
          <Input
            required
            placeholder="Número de parte"
            value={newPart.partNumber}
            onChange={(e) => setNewPart({ ...newPart, partNumber: e.target.value })}
          />
          <Input
            required
            placeholder="Nombre"
            value={newPart.name}
            onChange={(e) => setNewPart({ ...newPart, name: e.target.value })}
          />
          <Input
            type="number"
            min="0"
            placeholder="Existencia inicial"
            value={newPart.initialStock}
            onChange={(e) => setNewPart({ ...newPart, initialStock: e.target.value })}
          />
          <Input
            type="number"
            min="0"
            placeholder="Mínimo"
            value={newPart.minimumStock}
            onChange={(e) => setNewPart({ ...newPart, minimumStock: e.target.value })}
          />
          <div className="sm:col-span-4">
            <Button type="submit" disabled={createPartMutation.isPending}>
              Registrar repuesto
            </Button>
          </div>
        </form>
      ) : null}

      {partsQuery.isLoading ? (
        <p className="text-sm text-slate-500">Cargando inventario…</p>
      ) : parts.length === 0 ? (
        <p className="text-sm text-slate-500">Este taller no tiene repuestos registrados.</p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200">
          {parts.map((part) => (
            <li key={part.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
              <div>
                <p className="font-medium text-slate-800">
                  {part.name}{' '}
                  {part.current_stock <= part.minimum_stock ? (
                    <Badge variant="destructive">Bajo stock</Badge>
                  ) : null}
                </p>
                <p className="text-xs text-slate-500">
                  {part.part_number} · existencia {part.current_stock} · mínimo {part.minimum_stock}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setSelected(part)}>
                Movimientos
              </Button>
            </li>
          ))}
        </ul>
      )}

      {selected ? (
        <section className="space-y-3 rounded-lg border border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-700">
              {selected.name} — existencia actual: {selected.current_stock}
            </h2>
            <Button size="sm" variant="outline" onClick={() => setSelected(null)}>
              Cerrar
            </Button>
          </div>

          <form
            className="flex flex-wrap items-end gap-2"
            onSubmit={(event) => {
              event.preventDefault()
              movementMutation.mutate()
            }}
          >
            <select
              className="rounded-md border border-slate-300 px-2 py-2 text-sm"
              value={movement.movementType}
              onChange={(e) => setMovement({ ...movement, movementType: e.target.value as MovementType })}
            >
              {MOVEMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {MOVEMENT_LABELS[type]}
                </option>
              ))}
            </select>
            <Input
              type="number"
              min="0"
              className="w-32"
              value={movement.quantity}
              onChange={(e) => setMovement({ ...movement, quantity: e.target.value })}
            />
            <Button type="submit" disabled={movementMutation.isPending}>
              Registrar movimiento
            </Button>
            {movement.movementType === 'adjustment' ? (
              <p className="w-full text-xs text-slate-500">
                El ajuste fija la existencia en el valor indicado; no lo suma ni lo resta.
              </p>
            ) : null}
          </form>

          <ul className="divide-y divide-slate-100 text-sm">
            {(movementsQuery.data ?? []).map((m) => (
              <li key={m.id} className="flex justify-between py-2">
                <span>
                  {MOVEMENT_LABELS[m.movement_type]} · {m.quantity}
                </span>
                <span className="text-slate-500">
                  {m.previous_stock} → {m.new_stock}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
