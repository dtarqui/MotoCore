import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ClipboardList } from 'lucide-react'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Alert } from '@/shared/ui/alert'
import { Badge } from '@/shared/ui/badge'
import { Select } from '@/shared/ui/select'
import { EmptyState } from '@/shared/ui/empty-state'
import { Skeleton } from '@/shared/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/shared/ui/table'
import { useActiveOrgId } from '@/shared/lib/active-context'
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
 * Registro de auditoría de la organización activa (HU-22).
 *
 * Es la única pantalla reservada al Owner. La restricción no se confía a la
 * interfaz: la API responde 403 y la política de la base de datos tampoco
 * devuelve filas a otro rol (RF-704). Ocultar la ruta es comodidad para el
 * usuario, no el control de acceso.
 */
export function AuditoriaPage() {
  const orgId = useActiveOrgId()
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
        description="Acciones críticas registradas en la organización activa, con su autor y su fecha."
      />

      {error ? (
        <Alert variant="destructive">
          {error.code === 'audit.insufficient_permissions'
            ? 'Solo el propietario de la organización puede consultar la auditoría.'
            : error.message}
        </Alert>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <label className="text-sm text-gray-600 dark:text-gray-400" htmlFor="filtro-accion">
          Acción
        </label>
        <Select
          id="filtro-accion"
          className="w-auto"
          value={accion}
          onChange={(e) => setAccion(e.target.value as AuditAction | '')}
        >
          <option value="">Todas</option>
          {Object.entries(AUDIT_ACTION_LABELS).map(([valor, etiqueta]) => (
            <option key={valor} value={valor}>
              {etiqueta}
            </option>
          ))}
        </Select>
      </div>

      {auditQuery.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : entradas.length === 0 && !error ? (
        <EmptyState icon={ClipboardList} title="Todavía no hay acciones registradas en esta organización" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Acción</TableHead>
              <TableHead>Entidad</TableHead>
              <TableHead>Autor</TableHead>
              <TableHead>Fecha</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entradas.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-medium text-gray-900 dark:text-white">
                  {AUDIT_ACTION_LABELS[entry.action] ?? entry.action}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{entry.entity}</Badge>
                </TableCell>
                <TableCell className="text-gray-500 dark:text-gray-400">{describirAutor(entry)}</TableCell>
                <TableCell className="tabular-nums text-gray-500 dark:text-gray-400">
                  {formatearFecha(entry.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  )
}
