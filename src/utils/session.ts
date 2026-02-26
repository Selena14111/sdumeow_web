import { UserRole, type UserRole as UserRoleType } from '@/types/enums'

function decodeBase64Url(value: string): string | null {
  try {
    if (typeof globalThis.atob !== 'function') {
      return null
    }

    const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    return globalThis.atob(padded)
  } catch {
    return null
  }
}

export function getTokenExpiry(token: string): number | null {
  const payloadSegment = token.split('.')[1]
  if (!payloadSegment) {
    return null
  }

  const payloadJson = decodeBase64Url(payloadSegment)
  if (!payloadJson) {
    return null
  }

  try {
    const payload = JSON.parse(payloadJson) as { exp?: unknown }
    if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) {
      return null
    }

    return payload.exp
  } catch {
    return null
  }
}

export function isTokenExpired(token: string, nowMs = Date.now()): boolean {
  const expiry = getTokenExpiry(token)
  if (expiry === null) {
    return false
  }

  return expiry * 1000 <= nowMs
}

export function hasValidSession(role: UserRoleType | null, token: string | null, nowMs = Date.now()): boolean {
  if (!role) {
    return false
  }

  if (role === UserRole.Guest) {
    return true
  }

  if (!token) {
    return false
  }

  return !isTokenExpired(token, nowMs)
}
