import { API_BASE_URL } from '@/shared/config/api'
import type { AuthSession, LoginRequest, RegisterRequest } from './types'

type ProblemDetails = {
  title?: string
  detail?: string
}

function buildApiUrl(path: string) {
  const normalizedBase = API_BASE_URL.replace(/\/$/, '')
  return `${normalizedBase}${path}`
}

async function parseProblemDetails(response: Response) {
  try {
    const problem = (await response.json()) as ProblemDetails
    return problem.detail ?? problem.title ?? 'No fue posible completar la operación.'
  } catch {
    return 'No fue posible completar la operación.'
  }
}

export async function loginRequest(payload: LoginRequest) {
  const response = await fetch(buildApiUrl('/api/auth/login'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await parseProblemDetails(response)
    throw new Error(message)
  }

  const data = (await response.json()) as AuthSession
  return data
}

export async function registerRequest(payload: RegisterRequest) {
  const response = await fetch(buildApiUrl('/api/auth/register'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const message = await parseProblemDetails(response)
    throw new Error(message)
  }

  const data = (await response.json()) as AuthSession
  return data
}
