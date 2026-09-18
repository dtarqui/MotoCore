import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Package, Pencil, Repeat } from 'lucide-react'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { getWorkshops } from '@/modules/organizaciones/organizaciones-api'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Select } from '@/shared/ui/select'
import { Alert } from '@/shared/ui/alert'
import { Badge } from '@/shared/ui/badge'
import { EmptyState } from '@/shared/ui/empty-state'
import { Skeleton } from '@/shared/ui/skeleton'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { useToast } from '@/shared/ui/toast-context'
import { useActiveOrgId, useActiveWorkshopId } from '@/shared/lib/active-context'
import {
  createMovement,
  createPart,
  getMovements,
  getParts,
  getPartsInWorkshop,
  transferPart,
  updatePart,
} from '../inventario-api'
import { DIRECT_MOVEMENT_TYPES, MOVEMENT_EFFECT, MOVEMENT_LABELS, type DirectMovementType, type Part } from '../types'

type NewPartForm = { partNumber: string; name: string; initialStock: string; minimumStock: string }
const EMPTY_NEW_PART: NewPartForm = { partNumber: '', name: '', initialStock: '0', minimumStock: '0' }

/**
 * Inventario — nivel taller. Solo muestra los repuestos de el taller
 * activo: cambiar de taller cambia por completo el listado (RF-602).
 */
export function InventarioPage() {
  const { hasAnyRole } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const canManageCatalog = hasAnyRole(['owner', 'receptionist'])
  const canTransfer = hasAnyRole(['owner'])
  const activeOrgId = useActiveOrgId()
  const activeWorkshopId = useActiveWorkshopId()

  const [lowStockOnly, setLowStockOnly] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Part | null>(null)
  const [movementsFor, setMovementsFor] = useState<Part | null>(null)
  const [transferring, setTransferring] = useState<Part | null>(null)
  const [newPart, setNewPart] = useState<NewPartForm>(EMPTY_NEW_PART)
  const [error, setError] = useState<string | null>(null)

  // Organizacion y taller activos en la clave: al cambiar de contexto ninguna
  // respuesta puede servirse desde la cache del anterior (ADR-010).
  const partsQuery = useQuery({
    queryKey: ['parts', activeOrgId, activeWorkshopId, lowStockOnly],
    queryFn: () => getParts({ lowStock: lowStockOnly }),
    enabled: Boolean(activeWorkshopId),
  })

  const invalidateParts = () => queryClient.invalidateQueries({ queryKey: ['parts'] })

  const createPartMutation = useMutation({
    mutationFn: () =>
      createPart({
        part_number: newPart.partNumber,
        name: newPart.name,
        initial_stock: Number(newPart.initialStock) || 0,
        minimum_stock: Number(newPart.minimumStock) || 0,
      }),
    onSuccess: async (part) => {
      setCreateOpen(false)
      setNewPart(EMPTY_NEW_PART)
      setError(null)
      toast({ title: 'Repuesto registrado', description: part.name, variant: 'success' })
      await invalidateParts()
    },
    onError: (err: Error) => setError(err.message),
  })

  if (!activeWorkshopId) {
    return (
      <div className="space-y-6">
        <PageHeader title="Inventario" description="Existencias de el taller activo." />
        <Alert>Selecciona un taller para ver su inventario. Las existencias son propias de cada local.</Alert>
      </div>
    )
  }

  const parts = partsQuery.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inventario"
        description="Cada taller tiene sus propias existencias. El mismo número de parte puede existir en varias."
        actions={
          canManageCatalog ? (
            <Dialog
              open={createOpen}
              onOpenChange={(next) => {
                setCreateOpen(next)
                if (next) setError(null)
              }}
            >
              <DialogTrigger asChild>
                <Button type="button">Nuevo repuesto</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nuevo repuesto</DialogTitle>
                  <DialogDescription>Se registra en el taller activo.</DialogDescription>
                </DialogHeader>
                <form
                  className="space-y-3"
                  onSubmit={(event: FormEvent) => {
                    event.preventDefault()
                    createPartMutation.mutate()
                  }}
                >
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
                  <div className="grid grid-cols-2 gap-3">
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
                  </div>
                  {error ? <Alert variant="destructive">{error}</Alert> : null}
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancelar
                      </Button>
                    </DialogClose>
                    <Button type="submit" disabled={createPartMutation.isPending}>
                      {createPartMutation.isPending ? 'Registrando…' : 'Registrar repuesto'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      {error && !createOpen ? <Alert variant="destructive">{error}</Alert> : null}

      <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <input
          type="checkbox"
          checked={lowStockOnly}
          onChange={(event) => setLowStockOnly(event.target.checked)}
          className="accent-brand-600"
        />
        Mostrar solo repuestos en o por debajo del mínimo
      </label>

      {editing ? <PartEditDialog part={editing} onOpenChange={(next) => !next && setEditing(null)} /> : null}
      {movementsFor ? (
        <MovementsDialog part={movementsFor} onOpenChange={(next) => !next && setMovementsFor(null)} />
      ) : null}
      {transferring ? (
        <TransferDialog
          part={transferring}
          activeWorkshopId={activeWorkshopId}
          onOpenChange={(next) => !next && setTransferring(null)}
        />
      ) : null}

      {partsQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : parts.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Este taller no tiene repuestos registrados"
          description={canManageCatalog ? 'Registra el primero con el botón "Nuevo repuesto".' : undefined}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Repuesto</TableHead>
              <TableHead>Nº parte</TableHead>
              <TableHead>Existencia</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {parts.map((part) => (
              <TableRow key={part.id}>
                <TableCell className="font-medium text-gray-900 dark:text-white">{part.name}</TableCell>
                <TableCell className="text-gray-500 dark:text-gray-400">{part.part_number}</TableCell>
                <TableCell className="tabular-nums text-gray-700 dark:text-gray-300">
                  {part.current_stock} <span className="text-gray-400">/ mín. {part.minimum_stock}</span>
                </TableCell>
                <TableCell>
                  {part.current_stock <= part.minimum_stock ? (
                    <Badge variant="warning">Bajo stock</Badge>
                  ) : (
                    <Badge variant="secondary">Normal</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="outline" onClick={() => setMovementsFor(part)}>
                      Movimientos
                    </Button>
                    {canManageCatalog ? (
                      <Button size="sm" variant="outline" onClick={() => setEditing(part)}>
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Editar
                      </Button>
                    ) : null}
                    {canTransfer ? (
                      <Button size="sm" variant="outline" onClick={() => setTransferring(part)}>
                        <Repeat className="mr-1.5 h-3.5 w-3.5" />
                        Transferir
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}

/** Edita el catálogo de un repuesto — RF-609. El número de parte no se incluye: identifica la pieza. */
function PartEditDialog({ part, onOpenChange }: { part: Part; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [form, setForm] = useState({
    name: part.name,
    description: part.description ?? '',
    brand: part.brand ?? '',
    category: part.category ?? '',
    minimumStock: String(part.minimum_stock),
    maximumStock: part.maximum_stock !== null ? String(part.maximum_stock) : '',
    unitCost: part.unit_cost !== null ? String(part.unit_cost) : '',
  })
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      updatePart(part.id, {
        name: form.name,
        description: form.description || null,
        brand: form.brand || null,
        category: form.category || null,
        minimum_stock: Number(form.minimumStock) || 0,
        maximum_stock: form.maximumStock ? Number(form.maximumStock) : null,
        unit_cost: form.unitCost ? Number(form.unitCost) : null,
      }),
    onSuccess: async () => {
      toast({ title: 'Repuesto actualizado', variant: 'success' })
      await queryClient.invalidateQueries({ queryKey: ['parts'] })
      onOpenChange(false)
    },
    onError: (err: Error) => setError(err.message),
  })

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar {part.name}</DialogTitle>
          <DialogDescription>
            Número de parte: <span className="font-medium text-gray-700 dark:text-gray-300">{part.part_number}</span>{' '}
            (no editable).
          </DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(event: FormEvent) => {
            event.preventDefault()
            mutation.mutate()
          }}
        >
          <Input
            required
            placeholder="Nombre"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            placeholder="Descripción"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Marca"
              value={form.brand}
              onChange={(e) => setForm({ ...form, brand: e.target.value })}
            />
            <Input
              placeholder="Categoría"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input
              type="number"
              min="0"
              placeholder="Mínimo"
              value={form.minimumStock}
              onChange={(e) => setForm({ ...form, minimumStock: e.target.value })}
            />
            <Input
              type="number"
              min="0"
              placeholder="Máximo"
              value={form.maximumStock}
              onChange={(e) => setForm({ ...form, maximumStock: e.target.value })}
            />
            <Input
              type="number"
              min="0"
              step="0.01"
              placeholder="Costo unitario"
              value={form.unitCost}
              onChange={(e) => setForm({ ...form, unitCost: e.target.value })}
            />
          </div>
          {error ? <Alert variant="destructive">{error}</Alert> : null}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Guardando…' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Historial de movimientos y alta de uno nuevo — RF-604, RF-605, RF-606. */
function MovementsDialog({ part, onOpenChange }: { part: Part; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [movementType, setMovementType] = useState<DirectMovementType>('compra')
  const [quantity, setQuantity] = useState('1')
  const [error, setError] = useState<string | null>(null)

  const movementsQuery = useQuery({
    queryKey: ['movements', part.organization_id, part.workshop_id, part.id],
    queryFn: () => getMovements(part.id),
  })

  const partsQuery = useQuery({
    queryKey: ['parts', part.organization_id, part.workshop_id],
    // Refleja la existencia actual sin abandonar el diálogo tras cada movimiento.
    queryFn: () => getParts(),
  })
  const currentStock = partsQuery.data?.find((p) => p.id === part.id)?.current_stock ?? part.current_stock

  const mutation = useMutation({
    mutationFn: () => createMovement(part.id, { movement_type: movementType, quantity: Number(quantity) || 0 }),
    onSuccess: async () => {
      setError(null)
      setQuantity('1')
      toast({ title: 'Movimiento registrado', variant: 'success' })
      await queryClient.invalidateQueries({ queryKey: ['parts'] })
      await queryClient.invalidateQueries({ queryKey: ['movements'] })
    },
    onError: (err: Error) => setError(err.message),
  })

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{part.name}</DialogTitle>
          <DialogDescription>Existencia actual: {currentStock}</DialogDescription>
        </DialogHeader>

        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(event: FormEvent) => {
            event.preventDefault()
            mutation.mutate()
          }}
        >
          <Select
            className="flex-1"
            value={movementType}
            onChange={(e) => setMovementType(e.target.value as DirectMovementType)}
          >
            {DIRECT_MOVEMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {MOVEMENT_LABELS[type]}
              </option>
            ))}
          </Select>
          <Input
            type="number"
            min="0"
            className="w-28"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />
          <Button type="submit" disabled={mutation.isPending}>
            Registrar
          </Button>
          {MOVEMENT_EFFECT[movementType] === 'fija' ? (
            <p className="w-full text-xs text-gray-500 dark:text-gray-400">
              El ajuste fija la existencia en el valor indicado; no lo suma ni lo resta.
            </p>
          ) : null}
        </form>

        {error ? <Alert variant="destructive">{error}</Alert> : null}

        {movementsQuery.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : (movementsQuery.data ?? []).length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Sin movimientos registrados todavía.</p>
        ) : (
          <ul className="max-h-64 divide-y divide-gray-100 overflow-y-auto text-sm dark:divide-gray-800">
            {(movementsQuery.data ?? []).map((m) => (
              <li key={m.id} className="flex justify-between py-2">
                <span className="text-gray-700 dark:text-gray-300">
                  {MOVEMENT_LABELS[m.movement_type]} · {m.quantity}
                </span>
                <span className="tabular-nums text-gray-500 dark:text-gray-400">
                  {m.previous_stock} → {m.new_stock}
                </span>
              </li>
            ))}
          </ul>
        )}
      </DialogContent>
    </Dialog>
  )
}

/** Transfiere existencias a otro taller de la misma organización — RF-608, reservada al Owner. */
function TransferDialog({
  part,
  activeWorkshopId,
  onOpenChange,
}: {
  part: Part
  activeWorkshopId: string
  onOpenChange: (open: boolean) => void
}) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const activeOrgId = useActiveOrgId()
  const [toWorkshopId, setToWorkshopId] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [error, setError] = useState<string | null>(null)

  const workshopsQuery = useQuery({ queryKey: ['workshops', activeOrgId], queryFn: () => getWorkshops() })
  const destinations = (workshopsQuery.data ?? []).filter((w) => w.id !== activeWorkshopId && w.is_active)

  /**
   * El destino es el repuesto con el **mismo número de parte** en el taller
   * receptor: es la misma pieza, con existencia propia en cada local. Se
   * consulta aquí solo para avisar antes de enviar; quien decide es el
   * servidor, que responde `inventory.part_not_found` si no existe.
   */
  const destinationPartsQuery = useQuery({
    queryKey: ['parts', activeOrgId, toWorkshopId],
    queryFn: () => getPartsInWorkshop(toWorkshopId),
    enabled: Boolean(toWorkshopId),
  })
  const destinationPart = destinationPartsQuery.data?.find((p) => p.part_number === part.part_number)
  const destinationReady = !toWorkshopId || destinationPartsQuery.isLoading || Boolean(destinationPart)

  const mutation = useMutation({
    mutationFn: () => transferPart(part.id, { to_workshop_id: toWorkshopId, quantity: Number(quantity) || 0 }),
    onSuccess: async () => {
      toast({ title: 'Transferencia registrada', variant: 'success' })
      await queryClient.invalidateQueries({ queryKey: ['parts'] })
      await queryClient.invalidateQueries({ queryKey: ['movements'] })
      onOpenChange(false)
    },
    onError: (err: Error) => setError(err.message),
  })

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transferir {part.name}</DialogTitle>
          <DialogDescription>Existencia disponible en este taller: {part.current_stock}</DialogDescription>
        </DialogHeader>

        <form
          className="space-y-3"
          onSubmit={(event: FormEvent) => {
            event.preventDefault()
            mutation.mutate()
          }}
        >
          <Select required value={toWorkshopId} onChange={(e) => setToWorkshopId(e.target.value)}>
            <option value="">Taller de destino…</option>
            {destinations.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </Select>

          {toWorkshopId && !destinationPartsQuery.isLoading ? (
            destinationPart ? (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Llega a <span className="font-medium text-gray-700 dark:text-gray-300">{part.part_number}</span> en ese
                taller · existencia actual: {destinationPart.current_stock}
              </p>
            ) : (
              <Alert>
                Ese taller todavía no tiene el número de parte {part.part_number}. Regístralo ahí antes de transferir.
              </Alert>
            )
          ) : null}

          <Input
            type="number"
            min="1"
            max={part.current_stock}
            placeholder="Cantidad a transferir"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />

          {error ? <Alert variant="destructive">{error}</Alert> : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending || !toWorkshopId || !destinationReady}>
              {mutation.isPending ? 'Transfiriendo…' : 'Transferir'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
