import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Alert } from '@/shared/ui/alert'
import { Badge } from '@/shared/ui/badge'
import { createClient, deactivateClient, getClients, updateClient } from '../clientes-api'
import type { Client, ClientUpsertPayload } from '../types'

const EMPTY: ClientUpsertPayload = { firstName: '', lastName: '', email: '', phone: '', documentId: '', address: '', notes: '' }

/**
 * Clientes — nivel organización. Se listan según la organización activa, sin importar la
 * taller seleccionado: es la demostración visible de RF-502.
 */
export function ClientesPage() {
  const { hasAnyRole } = useAuth()
  const queryClient = useQueryClient()

  const canWrite = hasAnyRole(['owner', 'receptionist'])

  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState<Client | null>(null)
  const [form, setForm] = useState<ClientUpsertPayload>(EMPTY)
  const [error, setError] = useState<string | null>(null)

  const clientsQuery = useQuery({
    queryKey: ['clients', search],
    queryFn: () => getClients(search),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['clients'] })

  const saveMutation = useMutation({
    mutationFn: (payload: ClientUpsertPayload) =>
      editing ? updateClient(editing.id, payload) : createClient(payload),
    onSuccess: async () => {
      setForm(EMPTY)
      setEditing(null)
      setError(null)
      await invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  const deactivateMutation = useMutation({
    mutationFn: (clientId: string) => deactivateClient(clientId),
    onSuccess: invalidate,
    onError: (err: Error) => setError(err.message),
  })

  function startEdit(client: Client) {
    setEditing(client)
    setForm({
      firstName: client.first_name,
      lastName: client.last_name,
      email: client.email ?? '',
      phone: client.phone ?? '',
      documentId: client.document_id ?? '',
      address: client.address ?? '',
      notes: client.notes ?? '',
    })
  }

  const clients = clientsQuery.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Los clientes pertenecen a la organización y se atienden desde cualquiera de sus talleres."
      />

      {error ? <Alert variant="destructive">{error}</Alert> : null}

      <div className="flex gap-2">
        <Input
          placeholder="Buscar por nombre, email o documento"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
      </div>

      {canWrite ? (
        <form
          className="grid gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault()
            saveMutation.mutate(form)
          }}
        >
          <h2 className="sm:col-span-2 text-sm font-semibold text-slate-700">
            {editing ? `Editando: ${editing.first_name} ${editing.last_name}` : 'Nuevo cliente'}
          </h2>

          <Input
            required
            placeholder="Nombre"
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
          <Input
            required
            placeholder="Apellido"
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
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
            value={form.documentId}
            onChange={(e) => setForm({ ...form, documentId: e.target.value })}
          />
          <Input
            placeholder="Dirección"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />

          <div className="sm:col-span-2 flex gap-2">
            <Button type="submit" disabled={saveMutation.isPending}>
              {editing ? 'Guardar cambios' : 'Registrar cliente'}
            </Button>
            {editing ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEditing(null)
                  setForm(EMPTY)
                }}
              >
                Cancelar
              </Button>
            ) : null}
          </div>
        </form>
      ) : (
        <Alert>Tu rol permite consultar clientes, pero no crearlos ni editarlos.</Alert>
      )}

      {clientsQuery.isLoading ? (
        <p className="text-sm text-slate-500">Cargando clientes…</p>
      ) : clients.length === 0 ? (
        <p className="text-sm text-slate-500">No hay clientes registrados en esta organización.</p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200">
          {clients.map((client) => (
            <li key={client.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
              <div>
                <p className="font-medium text-slate-800">
                  {client.first_name} {client.last_name}{' '}
                  {client.is_active ? null : <Badge variant="secondary">Inactivo</Badge>}
                </p>
                <p className="text-xs text-slate-500">
                  {[client.email, client.phone, client.document_id].filter(Boolean).join(' · ') || '—'}
                </p>
              </div>
              {canWrite ? (
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(client)}>
                    Editar
                  </Button>
                  {client.is_active ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deactivateMutation.mutate(client.id)}
                    >
                      Dar de baja
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
