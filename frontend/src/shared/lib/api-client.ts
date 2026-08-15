import { API_BASE_URL } from '@/shared/config/api'
import { supabase } from '@/shared/lib/supabase'
import { getActiveOrgId, getActiveWorkshopId } from '@/shared/lib/active-context'

/** Problem Details (RFC 9457). `title` transporta el código `modulo.razon`. */
type ProblemDetails = {
  title?: string
  detail?: string
  errors?: Record<string, string[]>
}

/** Error de la API que conserva el código de negocio, no solo el mensaje. */
export class ApiError extends Error {
  // Campos declarados aparte: el proyecto compila con `erasableSyntaxOnly`,
  // que prohíbe las propiedades declaradas en los parámetros del constructor.
  readonly code: string
  readonly status: number
  readonly fieldErrors?: Record<string, string[]>

  constructor(code: string, message: string, status: number, fieldErrors?: Record<string, string[]>) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

function buildApiUrl(path: string) {
  const normalizedBase = API_BASE_URL.replace(/\/$/, '')
  return `${normalizedBase}${path}`
}

async function toApiError(response: Response) {
  try {
    const problem = (await response.json()) as ProblemDetails
    return new ApiError(
      problem.title ?? 'server.error',
      problem.detail ?? 'No fue posible completar la operación.',
      response.status,
      problem.errors,
    )
  } catch {
    return new ApiError('server.error', 'No fue posible completar la operación.', response.status)
  }
}

export type ApiRequestOptions = RequestInit & {
  /** Adjunta la sucursal activa. Solo para endpoints de nivel sucursal. */
  withWorkshop?: boolean
}

/**
 * Llama a la API adjuntando la credencial y el contexto activo.
 *
 * El token se lee de la sesión de Supabase en cada llamada, en lugar de
 * guardarse: el SDK lo renueva por su cuenta, y leerlo al vuelo evita enviar
 * uno caducado (RF-102).
 *
 * La empresa activa viaja en `X-Org-Id`; la sucursal, en `X-Workshop-Id` cuando
 * el endpoint lo requiere (ADR-005). El servidor revalida ambas contra la
 * membresía: enviarlas no concede acceso, solo indica sobre qué se opera.
 */
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const { withWorkshop, ...init } = options

  const { data } = await supabase.auth.getSession()
  const accessToken = data.session?.access_token

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(init.headers as Record<string, string> | undefined),
  }

  if (accessToken) headers.Authorization = `Bearer ${accessToken}`

  const orgId = getActiveOrgId()
  if (orgId) headers['X-Org-Id'] = orgId

  if (withWorkshop) {
    const workshopId = getActiveWorkshopId()
    if (workshopId) headers['X-Workshop-Id'] = workshopId
  }

  const response = await fetch(buildApiUrl(path), { ...init, headers })

  if (!response.ok) throw await toApiError(response)
  if (response.status === 204) return undefined as T

  return (await response.json()) as T
}

export function toNullable(value?: string) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}
