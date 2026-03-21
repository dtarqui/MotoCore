import type { AuthSession } from './types'

const AUTH_SESSION_STORAGE_KEY = 'motocore.auth.session'

function isSessionExpired(session: AuthSession) {
  return Date.parse(session.accessTokenExpiresAtUtc) <= Date.now()
}

export function loadStoredSession() {
  const raw = localStorage.getItem(AUTH_SESSION_STORAGE_KEY)

  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as AuthSession

    if (isSessionExpired(parsed)) {
      localStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
      return null
    }

    return parsed
  } catch {
    localStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
    return null
  }
}

export function storeSession(session: AuthSession) {
  localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(session))
}

export function clearStoredSession() {
  localStorage.removeItem(AUTH_SESSION_STORAGE_KEY)
}
