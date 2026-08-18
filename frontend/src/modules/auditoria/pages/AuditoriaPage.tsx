import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Alert } from '@/shared/ui/alert'
import { Badge } from '@/shared/ui/badge'
import { getActiveOrgId } from '@/shared/lib/active-context'
import { ApiError } from '@/shared/lib/api-client'
import {
  AUDIT_ACTION_LABELS,
  getAuditLog,
  type AuditAction,
  type AuditEntry,
} from '../auditoria-api'

/** Formato legible para la fecha del registro. */
function formatearFecha(iso: string) {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) return iso
  return fecha.toLocaleString('es-BO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Nombre de quien ejecutó la acción, con reserva cuando la cuenta ya no existe. */
function describirAutor(entry: AuditEntry) {
  const perfil = entry.performedByProfile
  if (perfil) {
    const nombre = `${perfil.first_name} ${perfil.last_name}`.trim()
    return nombre || perfil.email
  }
  // El registro sobrevive al borrado de la cuenta: es lo que exige RF-703.
  return entry.performedBy ? 'Cuenta eliminada' : 'Sistema'
}

/**
 * Registro de auditoría de la empresa activa (HU-22).
 *
 * Es la única pantalla reservada al Owner. La restricción no se confía a la
 * interfaz: la API responde 403 y la política de la base de datos tampoco
 * devuelve filas a otro rol (RF-704). Ocultar la ruta es comodidad para el
 * usuario, no el control de acceso.
 */
export function AuditoriaPage() {
  const orgId = getActiveOrgId()
  const [accion, setAccion] = useState<AuditAction | ''>('')

  const auditQuery = useQuery({
    queryKey: ['audit', orgId, accion],
    queryFn: () => getAuditLog({ action: accion || undefined }),
    enabled: Boolean(orgId),
  })

  const error = auditQuery.error as ApiError | null
  const entradas = auditQuery.data ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Auditoría"
        description="Acciones críticas registradas en la empresa activa, con su autor y su fecha."
      />

      {error ? (
        <Alert variant="destructive">
          {error.code === 'audit.insufficient_permissions'
            ? 'Solo el propietario de la empresa puede consultar la auditoría.'
            : error.message}
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm text-slate-600" htmlFor="filtro-accion">
          Acción
        </label>
        <select
          id="filtro-accion"
          className="rounded-md border border-slate-300 px-2 py-2 text-sm"
          value={accion}
          onChange={(e) => setAccion(e.target.value as AuditAction | '')}
        >
          <option value="">Todas</option>
          {Object.entries(AUDIT_ACTION_LABELS).map(([valor, etiqueta]) => (
            <option key={valor} value={valor}>
              {etiqueta}
            </option>
          ))}
        </select>
      </div>

      {auditQuery.isLoading ? (
        <p className="text-sm text-slate-500">Cargando el registro…</p>
      ) : entradas.length === 0 && !error ? (
        <p className="text-sm text-slate-500">
          Todavía no hay acciones registradas en esta empresa.
        </p>
      ) : (
        <ul className="divide-y divide-slate-200 rounded-lg border border-slate-200">
          {entradas.map((entry) => (
            <li key={entry.id} className="flex flex-wrap items-start justify-between gap-2 p-3">
              <div>
                <p className="font-medium text-slate-800">
                  {AUDIT_ACTION_LABELS[entry.action] ?? entry.action}{' '}
                  <Badge variant="secondary">{entry.entity}</Badge>
                </p>
                <p className="text-xs text-slate-500">
                  {describirAutor(entry)} · {formatearFecha(entry.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
