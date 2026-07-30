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
import {
  getUserWorkshops,
  getWorkshopMembers,
  inviteMember,
  removeMember,
  updateMemberRole,
  updateWorkshop,
} from '../talleres-api'
import type { InviteMemberPayload, UpdateWorkshopPayload } from '../types'

const initialInviteForm: InviteMemberPayload = {
  email: '',
  role: 'Receptionist',
}

export function TalleresPage() {
  const queryClient = useQueryClient()
  const { session, hasAnyRole } = useAuth()
  const accessToken = session?.accessToken ?? ''
  const isOwner = hasAnyRole(['Owner'])

  const [workshopForm, setWorkshopForm] = useState<UpdateWorkshopPayload | null>(null)
  const [inviteForm, setInviteForm] = useState<InviteMemberPayload>(initialInviteForm)
  const [formError, setFormError] = useState<string | null>(null)

  const workshopsQuery = useQuery({
    queryKey: ['workshops'],
    queryFn: () => getUserWorkshops(accessToken),
    enabled: Boolean(accessToken),
  })

  const workshop = useMemo(() => workshopsQuery.data?.[0] ?? null, [workshopsQuery.data])

  const membersQuery = useQuery({
    queryKey: ['workshop-members', workshop?.id],
    queryFn: () => getWorkshopMembers(workshop!.id, accessToken),
    enabled: Boolean(accessToken) && Boolean(workshop),
  })

  const currentForm =
    workshopForm ??
    (workshop
      ? {
          name: workshop.name,
          description: workshop.description ?? '',
          address: workshop.address ?? '',
          phoneNumber: workshop.phoneNumber ?? '',
          email: workshop.email ?? '',
        }
      : null)

  const updateWorkshopMutation = useMutation({
    mutationFn: async (payload: UpdateWorkshopPayload) => updateWorkshop(workshop!.id, payload, accessToken),
    onSuccess: async () => {
      setWorkshopForm(null)
      await queryClient.invalidateQueries({ queryKey: ['workshops'] })
    },
    onError: (error) => {
      setFormError(error instanceof Error ? error.message : 'No fue posible actualizar el taller.')
    },
  })

  const inviteMutation = useMutation({
    mutationFn: async (payload: InviteMemberPayload) => inviteMember(workshop!.id, payload, accessToken),
    onSuccess: async () => {
      setInviteForm(initialInviteForm)
      await queryClient.invalidateQueries({ queryKey: ['workshop-members', workshop?.id] })
    },
    onError: (error) => {
      setFormError(error instanceof Error ? error.message : 'No fue posible invitar al miembro.')
    },
  })

  const roleMutation = useMutation({
    mutationFn: async ({ memberId, role }: { memberId: string; role: string }) =>
      updateMemberRole(workshop!.id, memberId, role, accessToken),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['workshop-members', workshop?.id] })
    },
  })

  const removeMutation = useMutation({
    mutationFn: async (memberId: string) => removeMember(workshop!.id, memberId, accessToken),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['workshop-members', workshop?.id] })
    },
  })

  async function handleWorkshopSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    if (currentForm) {
      await updateWorkshopMutation.mutateAsync(currentForm)
    }
  }

  async function handleInviteSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFormError(null)
    await inviteMutation.mutateAsync(inviteForm)
  }

  const members = membersQuery.data ?? []

  return (
    <section>
      <PageHeader
        title="Taller"
        description="Datos del taller y administración de tu equipo."
      />

      {workshopsQuery.isLoading ? <p className="text-sm text-muted-foreground">Cargando...</p> : null}

      {!workshopsQuery.isLoading && !workshop ? (
        <Alert>
          <AlertTitle>Sin taller</AlertTitle>
          <AlertDescription>No perteneces a ningún taller todavía.</AlertDescription>
        </Alert>
      ) : null}

      {workshop ? (
        <>
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Datos del taller</CardTitle>
            </CardHeader>
            <CardContent>
              {isOwner && currentForm ? (
                <form className="grid grid-cols-1 gap-3 md:grid-cols-2" onSubmit={handleWorkshopSubmit}>
                  <Input
                    placeholder="Nombre"
                    required
                    value={currentForm.name}
                    onChange={(event) => setWorkshopForm({ ...currentForm, name: event.target.value })}
                  />
                  <Input
                    placeholder="Correo"
                    type="email"
                    value={currentForm.email}
                    onChange={(event) => setWorkshopForm({ ...currentForm, email: event.target.value })}
                  />
                  <Input
                    placeholder="Teléfono"
                    value={currentForm.phoneNumber}
                    onChange={(event) => setWorkshopForm({ ...currentForm, phoneNumber: event.target.value })}
                  />
                  <Input
                    placeholder="Dirección"
                    value={currentForm.address}
                    onChange={(event) => setWorkshopForm({ ...currentForm, address: event.target.value })}
                  />
                  <Input
                    placeholder="Descripción"
                    className="md:col-span-2"
                    value={currentForm.description}
                    onChange={(event) => setWorkshopForm({ ...currentForm, description: event.target.value })}
                  />
                  <div className="md:col-span-2">
                    <Button type="submit" disabled={updateWorkshopMutation.isPending}>
                      Guardar cambios
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{workshop.name}</p>
                  {workshop.description ? <p className="text-muted-foreground">{workshop.description}</p> : null}
                  {workshop.address ? <p className="text-muted-foreground">{workshop.address}</p> : null}
                  {workshop.phoneNumber ? <p className="text-muted-foreground">{workshop.phoneNumber}</p> : null}
                  {workshop.email ? <p className="text-muted-foreground">{workshop.email}</p> : null}
                </div>
              )}

              {formError ? (
                <Alert variant="destructive" className="mt-4">
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              ) : null}
            </CardContent>
          </Card>

          {isOwner ? (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Invitar miembro</CardTitle>
              </CardHeader>
              <CardContent>
                <form className="grid grid-cols-1 gap-3 md:grid-cols-4" onSubmit={handleInviteSubmit}>
                  <Input
                    placeholder="Correo"
                    type="email"
                    required
                    className="md:col-span-2"
                    value={inviteForm.email}
                    onChange={(event) => setInviteForm((current) => ({ ...current, email: event.target.value }))}
                  />
                  <select
                    className="flex h-10 w-full rounded-md border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gray-950 focus-visible:ring-offset-2 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50"
                    value={inviteForm.role}
                    onChange={(event) => setInviteForm((current) => ({ ...current, role: event.target.value }))}
                  >
                    <option value="Mechanic">Mecánico</option>
                    <option value="Receptionist">Recepcionista</option>
                  </select>
                  <Button type="submit" disabled={inviteMutation.isPending}>
                    Invitar
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Equipo</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Correo</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    {isOwner ? <TableHead>Acciones</TableHead> : null}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>{member.firstName} {member.lastName}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>
                        {isOwner && member.role !== 'Owner' ? (
                          <select
                            className="h-8 rounded-md border border-gray-200 bg-white px-2 text-xs dark:border-gray-800 dark:bg-gray-950 dark:text-gray-50"
                            value={member.role}
                            onChange={(event) =>
                              roleMutation.mutate({ memberId: member.userId, role: event.target.value })
                            }
                          >
                            <option value="Mechanic">Mecánico</option>
                            <option value="Receptionist">Recepcionista</option>
                          </select>
                        ) : (
                          <Badge variant="outline">{member.role}</Badge>
                        )}
                      </TableCell>
                      <TableCell>{member.isActive ? 'Activo' : 'Inactivo'}</TableCell>
                      {isOwner ? (
                        <TableCell>
                          {member.role !== 'Owner' ? (
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={removeMutation.isPending}
                              onClick={() => removeMutation.mutate(member.userId)}
                            >
                              Remover
                            </Button>
                          ) : null}
                        </TableCell>
                      ) : null}
                    </TableRow>
                  ))}
                  {!membersQuery.isLoading && members.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={isOwner ? 5 : 4} className="text-center text-sm text-gray-500">
                        Sin miembros registrados.
                      </TableCell>
                    </TableRow>
                  ) : null}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      ) : null}
    </section>
  )
}
