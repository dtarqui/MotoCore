import { useEffect, useState, type FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, Pencil, Plus, Wrench } from 'lucide-react'
import { useAuth } from '../auth/hooks/useAuth'
import {
  getActiveOrgId,
  getActiveWorkshopId,
  setActiveOrgId,
  setActiveWorkshopId,
  syncActiveOrgId,
} from '@/shared/lib/active-context'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Select } from '@/shared/ui/select'
import { Alert } from '@/shared/ui/alert'
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
import { useToast } from '@/shared/ui/toast-context'
import { createOrganization, getOrganizations, updateOrganization, getWorkshops } from './organizaciones-api'
import type { Organization } from '../auth/types'

/**
 * Selectores de organización y taller activos (RNF-401, HU-05, HU-07), más la
 * administración de la organización activa (RF-201, RF-204).
 *
 * Cambiar de organización no cierra la sesión: la identidad es global y solo
 * cambia el contexto sobre el que se opera.
 *
 * La selección efectiva se **deriva** en cada render en lugar de guardarse por
 * duplicado: si la organización o el taller elegidos dejan de ser válidos —porque
 * se removió la membresía o se desactivó el local—, se cae en la primera
 * disponible sin necesidad de sincronizar estados entre sí.
 */
export function ContextSelectors() {
  const { me, reloadMe, hasAnyRole } = useAuth()
  const queryClient = useQueryClient()

  // Lo que el usuario eligió; puede quedar obsoleto y por eso se valida abajo.
  const [chosenOrgId, setChosenOrgId] = useState<string | null>(getActiveOrgId())
  const [chosenWorkshopId, setChosenWorkshopId] = useState<string | null>(getActiveWorkshopId())

  const memberships = me?.organizations ?? []
  const orgId =
    memberships.find((m) => m.organization.id === chosenOrgId)?.organization.id ??
    memberships[0]?.organization.id ??
    null

  const workshopsQuery = useQuery({
    queryKey: ['workshops', orgId],
    queryFn: () => getWorkshops(),
    enabled: Boolean(orgId),
  })

  // `/api/auth/me` solo trae id/nombre/estado de cada organización; el
  // diálogo de edición necesita el resto de campos, que sí trae este listado.
  const organizationsQuery = useQuery({
    queryKey: ['organizations'],
    queryFn: getOrganizations,
    enabled: Boolean(orgId) && hasAnyRole(['owner']),
  })
  const activeOrganization = organizationsQuery.data?.find((m) => m.organization.id === orgId)?.organization

  const workshops = workshopsQuery.data ?? []
  const workshopId =
    workshops.find((w) => w.id === chosenWorkshopId)?.id ??
    (workshops.find((w) => w.is_active) ?? workshops[0])?.id ??
    null

  // Los efectos solo escriben en el almacén externo, que es lo que lee
  // `apiRequest`. No fijan estado de React: el valor ya está derivado.
  useEffect(() => {
    syncActiveOrgId(orgId)
  }, [orgId])

  useEffect(() => {
    setActiveWorkshopId(workshopId)
  }, [workshopId])

  async function handleOrgChange(nextOrgId: string) {
    setActiveOrgId(nextOrgId) // limpia también el taller
    setChosenOrgId(nextOrgId)
    setChosenWorkshopId(null)
    // Los datos en caché son de la organización anterior: no deben mostrarse.
    await queryClient.invalidateQueries()
    await reloadMe()
  }

  async function handleWorkshopChange(nextWorkshopId: string) {
    setActiveWorkshopId(nextWorkshopId)
    setChosenWorkshopId(nextWorkshopId)
    // Solo cambian los datos de nivel taller; los de organización siguen válidos.
    await queryClient.invalidateQueries({ queryKey: ['parts'] })
    await queryClient.invalidateQueries({ queryKey: ['movements'] })
  }

  if (!me) return null

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Cada grupo es una sola "píldora": el ícono nombra qué se está
          eligiendo, y los botones de administrar viven pegados a SU selector,
          no sueltos entre los dos. Antes ambos selectores podían mostrar el
          mismo nombre (el taller se llama igual que la organización) sin
          ninguna pista visual de cuál era cuál. */}
      <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white py-1 pl-2.5 pr-1 dark:border-gray-800 dark:bg-gray-950">
        <Building2 className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
        <label className="sr-only" htmlFor="selector-organizacion">
          Organización activa
        </label>
        <Select
          id="selector-organizacion"
          className="h-8 w-auto border-0 bg-transparent pr-7 focus-visible:ring-0 focus-visible:ring-offset-0"
          value={orgId ?? ''}
          onChange={(event) => void handleOrgChange(event.target.value)}
        >
          {memberships.map((m) => (
            <option key={m.organization.id} value={m.organization.id}>
              {m.organization.name}
            </option>
          ))}
        </Select>

        <CreateOrganizationDialog onCreated={handleOrgChange} />

        {hasAnyRole(['owner']) && activeOrganization ? (
          <EditOrganizationDialog organization={activeOrganization} onSaved={reloadMe} />
        ) : null}
      </div>

      <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-white py-1 pl-2.5 pr-1 dark:border-gray-800 dark:bg-gray-950">
        <Wrench className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
        <label className="sr-only" htmlFor="selector-taller">
          Taller activo
        </label>
        <Select
          id="selector-taller"
          className="h-8 w-auto border-0 bg-transparent pr-7 focus-visible:ring-0 focus-visible:ring-offset-0"
          value={workshopId ?? ''}
          disabled={workshops.length === 0}
          onChange={(event) => void handleWorkshopChange(event.target.value)}
        >
          {workshops.length === 0 ? (
            <option value="">Sin talleres</option>
          ) : (
            workshops.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
                {w.is_active ? '' : ' (inactivo)'}
              </option>
            ))
          )}
        </Select>
      </div>
    </div>
  )
}

/** Crea una organización adicional; el creador queda como Owner — RF-201. */
function CreateOrganizationDialog({ onCreated }: { onCreated: (orgId: string) => void | Promise<void> }) {
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: '', address: '', phone: '' })
  const [error, setError] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: () =>
      createOrganization({
        name: form.name,
        address: form.address || undefined,
        phone: form.phone || undefined,
      }),
    onSuccess: async (organization: Organization) => {
      setOpen(false)
      setForm({ name: '', address: '', phone: '' })
      setError(null)
      toast({ title: 'Organización creada', description: organization.name, variant: 'success' })
      await onCreated(organization.id)
    },
    onError: (err: Error) => setError(err.message),
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (!next) setError(null)
      }}
    >
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Nueva organización" aria-label="Nueva organización">
          <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva organización</DialogTitle>
          <DialogDescription>Quedarás como Propietario de la organización que crees aquí.</DialogDescription>
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
            placeholder="Nombre de la organización"
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

          {error ? <Alert variant="destructive">{error}</Alert> : null}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Creando…' : 'Crear organización'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

/** Edita los datos de la organización activa (solo Owner) — RF-204. */
function EditOrganizationDialog({
  organization,
  onSaved,
}: {
  organization: Organization
  onSaved: () => Promise<void>
}) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: organization.name,
    description: organization.description ?? '',
    address: organization.address ?? '',
    phone: organization.phone ?? '',
    email: organization.email ?? '',
  })
  const [error, setError] = useState<string | null>(null)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      // Reabrir siempre parte de los datos vigentes, no de un formulario obsoleto.
      setForm({
        name: organization.name,
        description: organization.description ?? '',
        address: organization.address ?? '',
        phone: organization.phone ?? '',
        email: organization.email ?? '',
      })
      setError(null)
    }
  }

  const mutation = useMutation({
    mutationFn: () =>
      updateOrganization(organization.id, {
        name: form.name,
        description: form.description || undefined,
        address: form.address || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
      }),
    onSuccess: async () => {
      setOpen(false)
      setError(null)
      toast({ title: 'Organización actualizada', variant: 'success' })
      await queryClient.invalidateQueries({ queryKey: ['organizations'] })
      await onSaved()
    },
    onError: (err: Error) => setError(err.message),
  })

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" title="Editar organización" aria-label="Editar organización">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar organización</DialogTitle>
          <DialogDescription>Solo el Propietario puede modificar estos datos.</DialogDescription>
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
          <Input
            placeholder="Dirección"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              placeholder="Teléfono"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
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
