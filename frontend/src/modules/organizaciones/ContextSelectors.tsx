import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../auth/hooks/useAuth'
import {
  getActiveOrgId,
  getActiveWorkshopId,
  setActiveOrgId,
  setActiveWorkshopId,
  syncActiveOrgId,
} from '@/shared/lib/active-context'
import { getWorkshops } from './organizaciones-api'

/**
 * Selectores de organización y taller activos (RNF-401, HU-05, HU-07).
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
  const { me, reloadMe } = useAuth()
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

  const selectClass =
    'rounded-md border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-400'

  return (
    <div className="flex flex-wrap items-center gap-2">
      <label className="sr-only" htmlFor="selector-organizacion">
        Organización activa
      </label>
      <select
        id="selector-organizacion"
        className={selectClass}
        value={orgId ?? ''}
        onChange={(event) => void handleOrgChange(event.target.value)}
      >
        {memberships.map((m) => (
          <option key={m.organization.id} value={m.organization.id}>
            {m.organization.name}
          </option>
        ))}
      </select>

      <label className="sr-only" htmlFor="selector-taller">
        Taller activo
      </label>
      <select
        id="selector-taller"
        className={selectClass}
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
      </select>
    </div>
  )
}
