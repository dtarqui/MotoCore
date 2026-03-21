import { useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { PageHeader } from '../../../shared/ui/PageHeader'
import { Card, CardContent } from '../../../shared/ui/card'
import { Button } from '../../../shared/ui/button'
import { Input } from '../../../shared/ui/input'
import { Alert, AlertDescription, AlertTitle } from '../../../shared/ui/alert'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../shared/ui/table'
import {
  createClient,
  deleteClient,
  getClients,
  updateClient,
} from '../clientes-api'
import type { ClientUpsertPayload } from '../types'

const initialForm: ClientUpsertPayload = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  secondaryPhone: '',
  address: '',
  city: '',
  postalCode: '',
  identificationNumber: '',
  companyName: '',
  taxId: '',
  birthDate: '',
  preferredContactMethod: '',
  notes: '',
}

export function ClientesPage() {
  const queryClient = useQueryClient()
  const { session } = useAuth()
  const accessToken = session?.accessToken ?? ''

  const [form, setForm] = useState<ClientUpsertPayload>(initialForm)
  const [editingClientId, setEditingClientId] = useState<string | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const clientsQuery = useQuery({
    queryKey: ['clients'],
    queryFn: () => getClients(accessToken),
    enabled: Boolean(accessToken),
  })

  const upsertMutation = useMutation({
    mutationFn: async (payload: ClientUpsertPayload) => {
      if (editingClientId) {
        return updateClient(editingClientId, payload, accessToken)
      }

      return createClient(payload, accessToken)
    },
    onSuccess: async () => {
      setForm(initialForm)
      setEditingClientId(null)
      await queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
    onError: (error) => {
      setFormError(error instanceof Error ? error.message : 'No fue posible guardar el cliente.')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (clientId: string) => {
      return deleteClient(clientId, accessToken)
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['clients'] })
    },
  })

  const clients = useMemo(() => clientsQuery.data ?? [], [clientsQuery.data])

  function handleChange<K extends keyof ClientUpsertPayload>(field: K, value: string) {
    setForm((current) => ({ ...current, [field]: value }))
  }

  function handleEdit(clientId: string) {
    const client = clients.find((item) => item.id === clientId)

    if (!client) {
      return
    }

    setEditingClientId(clientId)
    setFormError(null)
    setForm({
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone,
      secondaryPhone: client.secondaryPhone ?? '',
      address: client.address ?? '',
      city: client.city ?? '',
      postalCode: client.postalCode ?? '',
      identificationNumber: client.identificationNumber ?? '',
      companyName: client.companyName ?? '',
      taxId: client.taxId ?? '',
      birthDate: client.birthDate ? client.birthDate.slice(0, 10) : '',
      preferredContactMethod: client.preferredContactMethod ?? '',
      notes: client.notes ?? '',
    })
  }

  function handleCancelEdit() {
    setEditingClientId(null)
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
        title="Gestión de Clientes"
        description="Administra clientes del taller y datos de contacto."
      />

      <Card>
        <CardContent className="pt-6">
          <form className="grid grid-cols-1 gap-3 mb-6 md:grid-cols-2" onSubmit={handleSubmit}>
            <Input
              placeholder="Nombre"
              required
              value={form.firstName}
              onChange={(event) => handleChange('firstName', event.target.value)}
            />
            <Input
              placeholder="Apellido"
              required
              value={form.lastName}
              onChange={(event) => handleChange('lastName', event.target.value)}
            />
            <Input
              placeholder="Correo"
              type="email"
              required
              value={form.email}
              onChange={(event) => handleChange('email', event.target.value)}
            />
            <Input
              placeholder="Teléfono"
              required
              value={form.phone}
              onChange={(event) => handleChange('phone', event.target.value)}
            />

            <div className="md:col-span-2 flex gap-2">
              <Button type="submit" disabled={upsertMutation.isPending}>
                {editingClientId ? 'Guardar cambios' : 'Nuevo cliente'}
              </Button>
              {editingClientId ? (
                <Button type="button" variant="outline" onClick={handleCancelEdit}>
                  Cancelar
                </Button>
              ) : null}
            </div>
          </form>

          {formError ? (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Error en cliente</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex justify-between items-center mb-4">
            <p className="text-sm text-muted-foreground">
              {clients.length} clientes registrados
            </p>
            {clientsQuery.isLoading ? <p className="text-sm text-muted-foreground">Cargando...</p> : null}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.id.slice(0, 8)}</TableCell>
                  <TableCell>{client.firstName} {client.lastName}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell>{client.isActive ? 'Activo' : 'Inactivo'}</TableCell>
                  <TableCell className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(client.id)}>
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteMutation.mutate(client.id)}
                      disabled={deleteMutation.isPending}
                    >
                      Eliminar
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {!clientsQuery.isLoading && clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-sm text-gray-500">
                    No hay clientes registrados.
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