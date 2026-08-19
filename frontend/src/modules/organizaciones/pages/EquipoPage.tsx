import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/modules/auth/hooks/useAuth'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Alert } from '@/shared/ui/alert'
import { Badge } from '@/shared/ui/badge'
import { getActiveOrgId } from '@/shared/lib/active-context'
import { ROLE_LABELS } from '@/modules/auth/types'
import { getMembers, inviteMember, removeMember, updateMemberRole } from '../organizaciones-api'

type InvitableRole = 'mechanic' | 'receptionist'

/**
 * Equipo de la organización activa (HU-09 a HU-12).
 *
 * No aparece «Propietario» entre los roles asignables: el Owner es quien creó
 * la organización y no se otorga por invitación (RF-402).
 */
export function EquipoPage() {
  const { hasAnyRole, me } = useAuth()
  const queryClient = useQueryClient()
  const orgId = getActiveOrgId()

  const isOwner = hasAnyRole(['owner'])
  const [invite, setInvite] = useState<{ email: string; role: InvitableRole }>({
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
      setInvite({ email: '', role: 'mechanic' })
      setError(null)
      await invalidate()
    },
    onError: (err: Error) => setError(err.message),
  })

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: InvitableRole }) =>
      updateMemberRole(userId, role),
    onSuccess: invalidate,
    onError: (err: Error) => setError(err.message),
  })

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeMember(userId),
    onSuccess: invalidate,
    onError: (err: Error) => setError(err.message),
  })

  const members = membersQuery.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipo"
        description="El rol se otorga sobre la organización, no sobre un taller concreto."
      />

      {error ? <Alert variant="destructive">{error}</Alert> : null}

      {isOwner ? (
        <form
          className="flex flex-wrap items-end gap-2 rounded-lg border border-slate-200 p-4"
          onSubmit={(event) => {
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
          <select
            className="rounded-md border border-slate-300 px-2 py-2 text-sm"
            value={invite.role}
            onChange={(e) => setInvite({ ...invite, role: e.target.value as InvitableRole })}
          >
            <option value="mechanic">{ROLE_LABELS.mechanic}</option>
            <option value="receptionist">{ROLE_LABELS.receptionist}</option>
          </select>
          <Button type="submit" disabled={inviteMutation.isPending}>
            Invitar
          </Button>
        </form>
      ) : null}

      {membersQuery.isLoading ? (
        <p className="text-sm text-slate-500">Cargando el equipo…</p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200">
          {members.map((member) => {
            const isSelf = member.userId === me?.userId
            const isOwnerRow = member.role === 'owner'
            return (
              <li key={member.userId} className="flex flex-wrap items-center justify-between gap-2 p-3">
                <div>
                  <p className="font-medium text-slate-800">
                    {member.profile
                      ? `${member.profile.first_name} ${member.profile.last_name}`.trim() ||
                        member.profile.email
                      : member.userId}{' '}
                    {isSelf ? <Badge variant="secondary">Tú</Badge> : null}
                  </p>
                  <p className="text-xs text-slate-500">
                    {member.profile?.email} · {ROLE_LABELS[member.role]}
                  </p>
                </div>

                {isOwner && !isOwnerRow ? (
                  <div className="flex gap-2">
                    <select
                      className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                      value={member.role}
                      onChange={(e) =>
                        roleMutation.mutate({
                          userId: member.userId,
                          role: e.target.value as InvitableRole,
                        })
                      }
                    >
                      <option value="mechanic">{ROLE_LABELS.mechanic}</option>
                      <option value="receptionist">{ROLE_LABELS.receptionist}</option>
                    </select>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => removeMutation.mutate(member.userId)}
                    >
                      Remover
                    </Button>
                  </div>
                ) : null}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
