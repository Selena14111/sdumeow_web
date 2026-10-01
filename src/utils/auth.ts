import { UserRole } from '@/types/enums'
import { asRecord, asString } from '@/utils/format'
import { getTokenPayload } from '@/utils/session'

export function inferRoleFromEmail(email: string, fallback: UserRole = UserRole.User): UserRole {
  if (email.toLowerCase().includes('admin')) {
    return UserRole.Admin
  }

  return fallback
}

export function inferRoleFromAccount(account: string, fallback: UserRole = UserRole.User): UserRole {
  return inferRoleFromEmail(account, fallback)
}

export function normalizeRole(value: unknown, fallback: UserRole = UserRole.User): UserRole {
  const role = asString(value).trim().toLowerCase()
  if (role.includes('admin') || role.includes('manager')) {
    return UserRole.Admin
  }
  if (role.includes('guest')) {
    return UserRole.Guest
  }
  if (role.includes('user') || role.includes('student')) {
    return UserRole.User
  }

  return fallback
}

export function inferRoleFromProfile(profile: unknown, fallback: UserRole = UserRole.User): UserRole {
  const record = asRecord(profile)
  return normalizeRole(record.role || record.userRole || record.identity || record.permission, fallback)
}

export function inferRoleFromToken(token: string, fallback: UserRole = UserRole.User): UserRole {
  const payload = asRecord(getTokenPayload(token))
  const authorities = Array.isArray(payload.authorities) ? payload.authorities.join(',') : ''
  return normalizeRole(payload.role || payload.userRole || payload.identity || payload.scope || authorities, fallback)
}
