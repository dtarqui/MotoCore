import { API_BASE_URL } from '@/shared/config/api'

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
    return (
      problem.detail ??
      problem.title ??
      'No fue posible completar la operación.'
    )
  } catch {
    return 'No fue posible completar la operación.'
  }
}

export async function apiRequest<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(buildApiUrl(path), {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(await parseProblemDetails(response))
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export function toNullable(value?: string) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}
