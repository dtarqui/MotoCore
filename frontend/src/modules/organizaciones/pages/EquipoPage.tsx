import { useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Users } from 'lucide-react'
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
import { ROLE_LABELS } from '@/modules/auth/types'
import {
  getMembers,
  inviteMember,
  removeMember,
  updateMemberRole,
  type AssignableRole,
  type Member,
} from '../organizaciones-api'

/** El nombre visible del miembro; si el perfil no trae datos, su identificador. */
function describeMember(member: Member) {
  const name = `${member.first_name ?? ''} ${member.last_name ?? ''}`.trim()
  return name || member.email || member.user_id
}

/**
 * Equipo de la organización activa (HU-09 a HU-12).
 *
 * No aparece «Propietario» entre los roles asignables: el Owner es quien creó
 * la organización y no se otorga por invitación (RF-402).
 */
export function EquipoPage() {
  const { hasAnyRole, me } = useAuth()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const orgId = useActiveOrgId()

  const isOwner = hasAnyRole(['owner'])
  const [inviteOpen, setInviteOpen] = useState(false)
  const [invite, setInvite] = useState<{ email: string; role: AssignableRole }>({
    email: '',
    role: 'mechanic',
  })
  const [error, setError] = useState<string | null>(null)

  const membersQuery = useQuery({
    queryKey: ['members', orgId],
    queryFn: () => getMembers(),
    enabled: Boolean(orgId),
  })

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['members'] })

  const inviteMutation = useMutation({
    mutationFn: () => inviteMember(invite),
    onSuccess: async () => {
      setInviteOpen(false)
      setInvite({ email: '', role: 'mechanic' })
      setError(null)
      toast({ title: 'Invitación enviada', description: invite.email, variant: 'success' })
      await invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: AssignableRole }) => updateMemberRole(userId, role),
    onSuccess: async () => {
      toast({ title: 'Rol actualizado', variant: 'success' })
      await invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeMember(userId),
    onSuccess: async () => {
      toast({ title: 'Miembro removido', variant: 'success' })
      await invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  const members = membersQuery.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipo"
        description="El rol se otorga sobre la organización, no sobre un taller concreto."
        actions={
          isOwner ? (
            <Dialog
              open={inviteOpen}
              onOpenChange={(next) => {
                setInviteOpen(next)
                if (next) setError(null)
              }}
            >
              <DialogTrigger asChild>
                <Button type="button">Invitar</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invitar a la organización</DialogTitle>
                  <DialogDescription>
                    La cuenta debe existir de antemano; no se puede invitar como Propietario.
                  </DialogDescription>
                </DialogHeader>
                <form
                  className="space-y-3"
                  onSubmit={(event: FormEvent) => {
                    event.preventDefault()
                    inviteMutation.mutate()
                  }}
                >
                  <Input
                    required
                    type="email"
                    placeholder="Email de una cuenta existente"
                    value={invite.email}
                    onChange={(e) => setInvite({ ...invite, email: e.target.value })}
                  />
                  <Select
                    value={invite.role}
                    onChange={(e) => setInvite({ ...invite, role: e.target.value as AssignableRole })}
                  >
                    <option value="mechanic">{ROLE_LABELS.mechanic}</option>
                    <option value="receptionist">{ROLE_LABELS.receptionist}</option>
                  </Select>
                  {error ? <Alert variant="destructive">{error}</Alert> : null}
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        Cancelar
                      </Button>
                    </DialogClose>
                    <Button type="submit" disabled={inviteMutation.isPending}>
                      {inviteMutation.isPending ? 'Invitando…' : 'Invitar'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          ) : null
        }
      />

      {error && !inviteOpen ? <Alert variant="destructive">{error}</Alert> : null}

      {membersQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : members.length === 0 ? (
        <EmptyState icon={Users} title="Todavía no hay miembros en esta organización" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Rol</TableHead>
              {isOwner ? <TableHead className="text-right">Acciones</TableHead> : null}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => {
              const isSelf = member.user_id === me?.user_id
              const isOwnerRow = member.role === 'owner'
              return (
                <TableRow key={member.user_id}>
                  <TableCell className="font-medium text-gray-900 dark:text-white">
                    <span className="inline-flex items-center gap-2">
                      {describeMember(member)}
                      {isSelf ? <Badge variant="secondary">Tú</Badge> : null}
                    </span>
                  </TableCell>
                  <TableCell className="text-gray-500 dark:text-gray-400">{member.email ?? '—'}</TableCell>
                  <TableCell>
                    {isOwner && !isOwnerRow ? (
                      <Select
                        className="h-8 w-auto py-1"
                        value={member.role}
                        onChange={(e) =>
                          roleMutation.mutate({ userId: member.user_id, role: e.target.value as AssignableRole })
                        }
                      >
                        <option value="mechanic">{ROLE_LABELS.mechanic}</option>
                        <option value="receptionist">{ROLE_LABELS.receptionist}</option>
                      </Select>
                    ) : (
                      <Badge variant={isOwnerRow ? 'default' : 'secondary'}>{ROLE_LABELS[member.role]}</Badge>
                    )}
                  </TableCell>
                  {isOwner ? (
                    <TableCell className="text-right">
                      {!isOwnerRow ? (
                        <ConfirmDialog
                          trigger={
                            <Button size="sm" variant="outline">
                              Remover
                            </Button>
                          }
                          title={`¿Remover a ${describeMember(member)}?`}
                          description="Pierde el acceso a esta organización de inmediato."
                          confirmLabel="Remover"
                          onConfirm={() => removeMutation.mutate(member.user_id)}
                        />
                      ) : null}
                    </TableCell>
                  ) : null}
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
