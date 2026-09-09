import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, Pencil, Users } from 'lucide-react'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Select } from '@/shared/ui/select'
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
import { useActiveOrgId } from '@/shared/lib/active-context'
import {
  assignMemberToWorkshop,
  createWorkshop,
  deactivateWorkshop,
  getMembers,
  getWorkshopAssignments,
  getWorkshops,
  removeWorkshopAssignment,
  updateWorkshop,
  type Member,
} from '../organizaciones-api'
import type { Workshop } from '@/modules/auth/types'

type WorkshopFormValues = { name: string; address: string; phone: string }
const EMPTY_FORM: WorkshopFormValues = { name: '', address: '', phone: '' }

/** Talleres de la organización activa (HU-06 · RF-301, RF-302, RF-304, RF-305). */
export function TalleresPage() {
  const { hasAnyRole } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const orgId = useActiveOrgId()

  const isOwner = hasAnyRole(['owner'])
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<Workshop | null>(null)
  const [assigning, setAssigning] = useState<Workshop | null>(null)
  const [error, setError] = useState<string | null>(null)

  const workshopsQuery = useQuery({
    queryKey: ['workshops', orgId],
    queryFn: () => getWorkshops(),
    enabled: Boolean(orgId),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['workshops'] })

  const createMutation = useMutation({
    mutationFn: (values: WorkshopFormValues) =>
      createWorkshop({ name: values.name, address: values.address || undefined, phone: values.phone || undefined }),
    onSuccess: async (workshop) => {
      setCreateOpen(false)
      setError(null)
      toast({ title: 'Taller creado', description: workshop.name, variant: 'success' })
      await invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  const updateMutation = useMutation({
    mutationFn: (values: WorkshopFormValues) =>
      updateWorkshop(editing!.id, {
        name: values.name,
        address: values.address || undefined,
        phone: values.phone || undefined,
      }),
    onSuccess: async () => {
      setEditing(null)
      setError(null)
      toast({ title: 'Taller actualizado', variant: 'success' })
      await invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  const deactivateMutation = useMutation({
    mutationFn: (workshopId: string) => deactivateWorkshop(workshopId),
    onSuccess: async () => {
      toast({ title: 'Taller desactivado', variant: 'success' })
      await invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  const workshops = workshopsQuery.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Talleres"
        description="Locales de la organización. El taller indica dónde ocurre una operación; no restringe quién puede verla."
        actions={
          isOwner ? (
            <WorkshopFormDialog
              open={createOpen}
              onOpenChange={setCreateOpen}
              title="Nuevo taller"
              description="Se agrega a la organización activa."
              submitLabel="Crear taller"
              isPending={createMutation.isPending}
              onSubmit={(values) => createMutation.mutate(values)}
              trigger={<Button type="button">Nuevo taller</Button>}
            />
          ) : null
        }
      />

      {error ? <Alert variant="destructive">{error}</Alert> : null}
      {!isOwner ? <Alert>Solo el Propietario puede administrar los talleres de la organización.</Alert> : null}

      {editing ? (
        <WorkshopFormDialog
          open
          onOpenChange={(next) => !next && setEditing(null)}
          title={`Editar: ${editing.name}`}
          description="Los cambios se aplican de inmediato."
          submitLabel="Guardar cambios"
          isPending={updateMutation.isPending}
          initialValues={{ name: editing.name, address: editing.address ?? '', phone: editing.phone ?? '' }}
          onSubmit={(values) => updateMutation.mutate(values)}
        />
      ) : null}

      {assigning ? (
        <WorkshopAssignmentsDialog workshop={assigning} onOpenChange={(next) => !next && setAssigning(null)} />
      ) : null}

      {workshopsQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : workshops.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Todavía no hay talleres registrados"
          description={isOwner ? 'Crea el primero con el botón "Nuevo taller".' : undefined}
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Contacto</TableHead>
              <TableHead>Estado</TableHead>
              {isOwner ? <TableHead className="text-right">Acciones</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {workshops.map((workshop) => (
              <TableRow key={workshop.id}>
                <TableCell className="font-medium text-gray-900 dark:text-white">{workshop.name}</TableCell>
                <TableCell className="text-gray-500 dark:text-gray-400">
                  {[workshop.address, workshop.phone].filter(Boolean).join(' · ') || '—'}
                </TableCell>
                <TableCell>
                  {workshop.is_active ? (
                    <Badge variant="secondary">Activo</Badge>
                  ) : (
                    <Badge variant="outline">Inactivo</Badge>
                  )}
                </TableCell>
                {isOwner ? (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="outline" onClick={() => setAssigning(workshop)}>
                        <Users className="mr-1.5 h-3.5 w-3.5" />
                        Miembros
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditing(workshop)}>
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Editar
                      </Button>
                      {workshop.is_active ? (
                        <ConfirmDialog
                          trigger={
                            <Button size="sm" variant="outline">
                              Desactivar
                            </Button>
                          }
                          title={`¿Desactivar ${workshop.name}?`}
                          description="El taller deja de listarse como activo; su historial se conserva."
                          confirmLabel="Desactivar"
                          onConfirm={() => deactivateMutation.mutate(workshop.id)}
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

/** Formulario de alta/edición de taller — comparte forma entre RF-301 crear y editar. */
function WorkshopFormDialog({
  open,
  onOpenChange,
  title,
  description,
  submitLabel,
  isPending,
  initialValues,
  onSubmit,
  trigger,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  submitLabel: string
  isPending: boolean
  initialValues?: WorkshopFormValues
  onSubmit: (values: WorkshopFormValues) => void
  trigger?: React.ReactNode
}) {
  const [form, setForm] = useState<WorkshopFormValues>(initialValues ?? EMPTY_FORM)

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) setForm(initialValues ?? EMPTY_FORM)
        onOpenChange(next)
      }}
    >
      {trigger ? <DialogTrigger asChild>{trigger}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form
          className="space-y-3"
          onSubmit={(event: FormEvent) => {
            event.preventDefault()
            onSubmit(form)
          }}
        >
          <Input
            required
            placeholder="Nombre (único en la organización)"
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
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando…' : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Asignación operativa de miembros a un taller — RF-304. No cambia permisos, solo indica dónde trabaja cada quien. */
function WorkshopAssignmentsDialog({
  workshop,
  onOpenChange,
}: {
  workshop: Workshop
  onOpenChange: (open: boolean) => void
}) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [error, setError] = useState<string | null>(null)
  const [selectedUserId, setSelectedUserId] = useState('')

  const assignmentsQuery = useQuery({
    queryKey: ['workshop-assignments', workshop.id],
    queryFn: () => getWorkshopAssignments(workshop.id),
  })

  const membersQuery = useQuery({
    queryKey: ['members'],
    queryFn: () => getMembers(),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['workshop-assignments', workshop.id] })

  const assignMutation = useMutation({
    mutationFn: (userId: string) => assignMemberToWorkshop(workshop.id, userId),
    onSuccess: async () => {
      setSelectedUserId('')
      setError(null)
      toast({ title: 'Miembro asignado', variant: 'success' })
      await invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeWorkshopAssignment(workshop.id, userId),
    onSuccess: async () => {
      toast({ title: 'Asignación retirada', variant: 'success' })
      await invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  const members: Member[] = membersQuery.data ?? []
  const membersById = new Map(members.map((m) => [m.userId, m]))
  const assignments = (assignmentsQuery.data ?? []).filter((a) => a.userId)
  const assignedIds = new Set(assignments.map((a) => a.userId))
  const availableMembers = members.filter((m) => !assignedIds.has(m.userId))

  function describe(member: Member | undefined, fallbackId: string) {
    if (!member) return fallbackId
    const name = member.profile ? `${member.profile.first_name} ${member.profile.last_name}`.trim() : ''
    return name || member.profile?.email || fallbackId
  }

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Miembros de {workshop.name}</DialogTitle>
          <DialogDescription>
            Indica dónde trabaja cada quien; no cambia lo que puede ver o hacer, eso lo decide su rol.
          </DialogDescription>
        </DialogHeader>

        {error ? <Alert variant="destructive">{error}</Alert> : null}

        {assignmentsQuery.isLoading ? (
          <Skeleton className="h-24 w-full" />
        ) : assignments.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Nadie está asignado a este taller todavía.</p>
        ) : (
          <ul className="divide-y divide-gray-200 rounded-md border border-gray-200 dark:divide-gray-800 dark:border-gray-800">
            {assignments.map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 p-3 text-sm">
                <span className="text-gray-800 dark:text-gray-100">
                  {describe(membersById.get(a.userId!), a.userId!)}
                </span>
                <Button size="sm" variant="outline" onClick={() => removeMutation.mutate(a.userId!)}>
                  Quitar
                </Button>
              </li>
            ))}
          </ul>
        )}

        {membersQuery.isLoading || assignmentsQuery.isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : availableMembers.length > 0 ? (
          <div className="flex flex-wrap items-end gap-2">
            <Select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="flex-1"
            >
              <option value="">Elegir miembro…</option>
              {availableMembers.map((m) => (
                <option key={m.userId} value={m.userId}>
                  {describe(m, m.userId)}
                </option>
              ))}
            </Select>
            <Button
              type="button"
              disabled={!selectedUserId || assignMutation.isPending}
              onClick={() => assignMutation.mutate(selectedUserId)}
            >
              Asignar
            </Button>
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Todos los miembros de la organización ya están asignados a este taller.
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}
