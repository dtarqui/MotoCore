import { API_BASE_URL } from '@/shared/config/api'
import { apiRequest, ApiError } from '@/shared/lib/api-client'
import type { MeResponse, Organization, RegisterRequest, Workshop } from './types'

/**
 * El registro es la única operación de identidad que pasa por nuestra API: crea
 * la cuenta y, en el mismo acto, la primera organización, su primer taller y la
 * membresía propietaria (RF-101). El resto —inicio de sesión, renovación,
 * recuperación de contraseña— lo hace el cliente contra Supabase Auth (ADR-004).
 *
 * No usa `apiRequest` porque es la única llamada sin credencial: adjuntar una
 * sesión aquí no tendría sentido, y un `401` no debe cerrar nada.
 */
export async function registerRequest(payload: RegisterRequest) {
  const response = await fetch(`${API_BASE_URL.replace(/\/$/, '')}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const problem = (await response.json().catch(() => ({}))) as { title?: string; detail?: string }
    throw new ApiError(
      problem.title ?? 'server.error',
      problem.detail ?? 'No fue posible completar el registro.',
      response.status,
    )
  }

  return (await response.json()) as {
    user_id: string
    organization: Organization
    workshop: Workshop | null
  }
}

/** Perfil y organizaciones de la cuenta autenticada, con su rol en cada una (RF-104). */
export function fetchMe() {
  return apiRequest<MeResponse>('/api/auth/me')
}
