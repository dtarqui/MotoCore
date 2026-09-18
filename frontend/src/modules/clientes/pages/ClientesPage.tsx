import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Users } from 'lucide-react'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { useActiveOrgId } from '@/shared/lib/active-context'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Alert } from '@/shared/ui/alert'
import { Badge } from '@/shared/ui/badge'
import { EmptyState } from '@/shared/ui/empty-state'
import { Skeleton } from '@/shared/ui/skeleton'
import { ConfirmDialog } from '@/shared/ui/confirm-dialog'
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
import { createClient, deactivateClient, getClients, updateClient } from '../clientes-api'
import type { Client, ClientUpsertPayload } from '../types'

const EMPTY: ClientUpsertPayload = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  document_id: '',
  address: '',
  notes: '',
}

/**
 * Clientes — nivel organización. Se listan según la organización activa, sin importar la
 * taller seleccionado: es la demostración visible de RF-502.
 */
export function ClientesPage() {
  const { hasAnyRole } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const canWrite = hasAnyRole(['owner', 'receptionist'])
  const orgId = useActiveOrgId()

  const [search, setSearch] = useState('')
  // RF-504: la baja es lógica y el registro se conserva; poder verlo es lo que
  // lo hace comprobable desde la interfaz.
  const [includeInactive, setIncludeInactive] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState<ClientUpsertPayload>(EMPTY)
  const [error, setError] = useState<string | null>(null)

  // El contexto activo forma parte de la clave: ninguna respuesta puede
  // servirse desde la cache de otra organizacion (ADR-010).
  const clientsQuery = useQuery({
    queryKey: ['clients', orgId, search, includeInactive],
    queryFn: () => getClients({ search, includeInactive }),
    enabled: Boolean(orgId),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['clients'] })

  const saveMutation = useMutation({
    mutationFn: (payload: ClientUpsertPayload) => (editing ? updateClient(editing.id, payload) : createClient(payload)),
    onSuccess: async (client) => {
      setDialogOpen(false)
      setForm(EMPTY)
      setError(null)
      toast({
        title: editing ? 'Cliente actualizado' : 'Cliente registrado',
        description: `${client.first_name} ${client.last_name}`.trim(),
        variant: 'success',
      })
      setEditing(null)
      await invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  const deactivateMutation = useMutation({
    mutationFn: (clientId: string) => deactivateClient(clientId),
    onSuccess: async () => {
      toast({ title: 'Cliente dado de baja', variant: 'success' })
      await invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  function openCreate() {
    setEditing(null)
    setForm(EMPTY)
    setError(null)
    setDialogOpen(true)
  }

  function openEdit(client: Client) {
    setEditing(client)
    setForm({
      first_name: client.first_name,
      last_name: client.last_name,
      email: client.email ?? '',
      phone: client.phone ?? '',
      document_id: client.document_id ?? '',
      address: client.address ?? '',
      notes: client.notes ?? '',
    })
    setError(null)
    setDialogOpen(true)
  }

  const clients = clientsQuery.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Los clientes pertenecen a la organización y se atienden desde cualquiera de sus talleres."
        actions={
          canWrite ? (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button type="button" onClick={openCreate}>
                  Nuevo cliente
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editing ? `Editar a ${editing.first_name} ${editing.last_name}` : 'Nuevo cliente'}
                  </DialogTitle>
                  <DialogDescription>
                    {editing
                      ? 'Los cambios se aplican de inmediato.'
                      : 'Se registra en la organización activa, visible desde cualquiera de sus talleres.'}
                  </DialogDescription>
                </DialogHeader>
                <form
                  className="grid gap-3 sm:grid-cols-2"
                  onSubmit={(event: FormEvent) => {
                    event.preventDefault()
                    saveMutation.mutate(form)
                  }}
                >
                  <Input
                    required
                    placeholder="Nombre"
                    value={form.first_name}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                  />
                  <Input
                    required
                    placeholder="Apellido"
                    value={form.last_name}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                  />
                  <Input
                    type="email"
                    placeholder="Email (único dentro de la organización)"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  <Input
                    placeholder="Teléfono"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                  <Input
                    placeholder="Documento de identidad"
                    value={form.document_id}
                    onChange={(e) => setForm({ ...form, document_id: e.target.value })}
                  />
                  <Input
                    placeholder="Dirección"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                  />

                  {error ? (
                    <div className="sm:col-span-2">
                      <Alert variant="destructive">{error}</Alert>
                    </div>
                  ) : null}

                  <DialogFooter className="sm:col-span-2">
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancelar
                      </Button>
                    </DialogClose>
                    <Button type="submit" disabled={saveMutation.isPending}>
                      {saveMutation.isPending ? 'Guardando…' : editing ? 'Guardar cambios' : 'Registrar cliente'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      {error && !dialogOpen ? <Alert variant="destructive">{error}</Alert> : null}
      {!canWrite ? <Alert>Tu rol permite consultar clientes, pero no crearlos ni editarlos.</Alert> : null}

      <div className="flex flex-wrap items-center gap-4">
        <Input
          placeholder="Buscar por nombre, email o documento"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="max-w-md"
        />
        <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(event) => setIncludeInactive(event.target.checked)}
            className="accent-brand-600"
          />
          Incluir los dados de baja
        </label>
      </div>

      {clientsQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No hay clientes registrados en esta organización"
          description={canWrite ? 'Registra el primero con el botón "Nuevo cliente".' : undefined}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Estado</TableHead>
              {canWrite ? <TableHead className="text-right">Acciones</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id}>
                <TableCell className="font-medium text-gray-900 dark:text-white">
                  {client.first_name} {client.last_name}
                </TableCell>
                <TableCell className="text-gray-500 dark:text-gray-400">
                  {[client.email, client.phone, client.document_id].filter(Boolean).join(' · ') || '—'}
                </TableCell>
                <TableCell>
                  {client.is_active ? (
                    <Badge variant="secondary">Activo</Badge>
                  ) : (
                    <Badge variant="outline">Inactivo</Badge>
                  )}
                </TableCell>
                {canWrite ? (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(client)}>
                        Editar
                      </Button>
                      {client.is_active ? (
                        <ConfirmDialog
                          trigger={
                            <Button size="sm" variant="outline">
                              Dar de baja
                            </Button>
                          }
                          title={`¿Dar de baja a ${client.first_name} ${client.last_name}?`}
                          description="Se conserva su historial; deja de aparecer en los listados activos."
                          confirmLabel="Dar de baja"
                          onConfirm={() => deactivateMutation.mutate(client.id)}
                        />
                      ) : null}
                    </div>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
