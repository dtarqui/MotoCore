import { useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
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
import { createMovement, createPart, getParts } from '../inventario-api'
import {
  PART_MOVEMENT_TYPES,
  PART_MOVEMENT_TYPE_LABELS,
  type CreatePartPayload,
  type CreatePartMovementPayload,
  type PartMovementTypeValue,
} from '../types'

const initialPartForm: CreatePartPayload = {
  partNumber: '',
  name: '',
  brand: '',
  category: '',
  initialStock: 0,
  minimumStock: 0,
  maximumStock: 0,
  unitCost: 0,
  salePrice: 0,
}

const initialMovementForm: CreatePartMovementPayload = {
  partId: '',
  movementType: 'Purchase',
  quantity: 0,
}

export function InventarioPage() {
  const queryClient = useQueryClient()
  const { session, hasAnyRole } = useAuth()
  const accessToken = session?.accessToken ?? ''
  const canManageParts = hasAnyRole(['Owner', 'Receptionist'])

  const [partForm, setPartForm] = useState<CreatePartPayload>(initialPartForm)
  const [movementForm, setMovementForm] = useState<CreatePartMovementPayload>(initialMovementForm)
  const [formError, setFormError] = useState<string | null>(null)

  const partsQuery = useQuery({
    queryKey: ['parts'],
    queryFn: () => getParts(accessToken),
    enabled: Boolean(accessToken),
  })

  const parts = useMemo(() => partsQuery.data ?? [], [partsQuery.data])
  const lowStockItems = useMemo(
    () => parts.filter((part) => part.currentStock <= part.minimumStock),
    [parts],
  )

  const createPartMutation = useMutation({
    mutationFn: async (payload: CreatePartPayload) => createPart(payload, accessToken),
    onSuccess: async () => {
      setPartForm(initialPartForm)
      await queryClient.invalidateQueries({ queryKey: ['parts'] })
    },
    onError: (error) => {
      setFormError(error instanceof Error ? error.message : 'No fue posible crear el repuesto.')
    },
  })

  const createMovementMutation = useMutation({
    mutationFn: async (payload: CreatePartMovementPayload) => createMovement(payload, accessToken),
    onSuccess: async () => {
      setMovementForm(initialMovementForm)
      await queryClient.invalidateQueries({ queryKey: ['parts'] })
    },
    onError: (error) => {
      setFormError(error instanceof Error ? error.message : 'No fue posible registrar el movimiento.')
    },
  })

  function handlePartChange<K extends keyof CreatePartPayload>(field: K, value: CreatePartPayload[K]) {
    setPartForm((current) => ({ ...current, [field]: value }))
  }

  async function handlePartSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    await createPartMutation.mutateAsync(partForm)
  }

  async function handleMovementSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    await createMovementMutation.mutateAsync(movementForm)
  }

  return (
    <section>
      <PageHeader
        title="Inventario"
        description="Control de stock y alertas de repuestos críticos."
      />

      {lowStockItems.length > 0 && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Atención</AlertTitle>
          <AlertDescription>
            {lowStockItems.length} productos con stock bajo requieren atención.
          </AlertDescription>
        </Alert>
      )}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Alertas de bajo stock</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {lowStockItems.map((part) => (
              <div key={part.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium text-sm">{part.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Stock: {part.currentStock} / Mínimo: {part.minimumStock}
                  </p>
                </div>
                <Badge variant="destructive">Crítico</Badge>
              </div>
            ))}
            {lowStockItems.length === 0 ? (
              <p className="text-sm text-gray-500">Sin alertas de stock bajo.</p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      {canManageParts ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Nuevo repuesto</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid grid-cols-1 gap-3 md:grid-cols-4" onSubmit={handlePartSubmit}>
              <Input
                placeholder="Código"
                required
                value={partForm.partNumber}
                onChange={(event) => handlePartChange('partNumber', event.target.value)}
              />
              <Input
                placeholder="Nombre"
                required
                className="md:col-span-2"
                value={partForm.name}
                onChange={(event) => handlePartChange('name', event.target.value)}
              />
              <Input
                placeholder="Categoría"
                value={partForm.category}
                onChange={(event) => handlePartChange('category', event.target.value)}
              />
              <Input
                placeholder="Stock inicial"
                type="number"
                min={0}
                value={partForm.initialStock}
                onChange={(event) => handlePartChange('initialStock', Number(event.target.value))}
              />
              <Input
                placeholder="Stock mínimo"
                type="number"
                min={0}
                value={partForm.minimumStock}
                onChange={(event) => handlePartChange('minimumStock', Number(event.target.value))}
              />
              <Input
                placeholder="Stock máximo"
                type="number"
                min={0}
                value={partForm.maximumStock}
                onChange={(event) => handlePartChange('maximumStock', Number(event.target.value))}
              />
              <Input
                placeholder="Costo unitario"
                type="number"
                min={0}
                step="0.01"
                value={partForm.unitCost}
                onChange={(event) => handlePartChange('unitCost', Number(event.target.value))}
              />
              <Input
                placeholder="Precio de venta"
                type="number"
                min={0}
                step="0.01"
                className="md:col-span-2"
                value={partForm.salePrice}
                onChange={(event) => handlePartChange('salePrice', Number(event.target.value))}
              />

              <div className="md:col-span-4">
                <Button type="submit" disabled={createPartMutation.isPending}>
                  Crear repuesto
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Registrar movimiento</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="grid grid-cols-1 gap-3 md:grid-cols-4" onSubmit={handleMovementSubmit}>
            <select
              required
              className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50"
              value={movementForm.partId}
              onChange={(event) =>
                setMovementForm((current) => ({ ...current, partId: event.target.value }))
              }
            >
              <option value="">Seleccionar repuesto...</option>
              {parts.map((part) => (
                <option key={part.id} value={part.id}>
                  {part.partNumber} — {part.name}
                </option>
              ))}
            </select>
            <select
              className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50"
              value={movementForm.movementType}
              onChange={(event) =>
                setMovementForm((current) => ({
                  ...current,
                  movementType: event.target.value as PartMovementTypeValue,
                }))
              }
            >
              {PART_MOVEMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {PART_MOVEMENT_TYPE_LABELS[type]}
                </option>
              ))}
            </select>
            <Input
              placeholder="Cantidad"
              type="number"
              min={1}
              required
              value={movementForm.quantity}
              onChange={(event) =>
                setMovementForm((current) => ({ ...current, quantity: Number(event.target.value) }))
              }
            />

            <Button type="submit" disabled={createMovementMutation.isPending}>
              Registrar movimiento
            </Button>
          </form>

          {formError ? (
            <Alert variant="destructive" className="mt-4">
              <AlertTitle>Error de inventario</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Repuestos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">{parts.length} repuestos registrados</p>
            {partsQuery.isLoading ? <p className="text-sm text-muted-foreground">Cargando...</p> : null}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead>Mínimo</TableHead>
                <TableHead>Precio</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {parts.map((part) => (
                <TableRow key={part.id}>
                  <TableCell className="font-medium">{part.partNumber}</TableCell>
                  <TableCell>{part.name}</TableCell>
                  <TableCell>{part.currentStock}</TableCell>
                  <TableCell>{part.minimumStock}</TableCell>
                  <TableCell>${part.salePrice.toFixed(2)}</TableCell>
                  <TableCell>
                    {part.currentStock <= part.minimumStock ? (
                      <Badge variant="destructive">Bajo stock</Badge>
                    ) : (
                      <Badge variant="outline">Normal</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {!partsQuery.isLoading && parts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-gray-500">
                    No hay repuestos registrados.
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
