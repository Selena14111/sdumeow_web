import { UserRole } from '@/types/enums'

export function inferRoleFromEmail(email: string, fallback = UserRole.User): UserRole {
  if (email.toLowerCase().includes('admin')) {
    return UserRole.Admin
  }

  return fallback
}

export function inferRoleFromAccount(account: string, fallback = UserRole.User): UserRole {
  return inferRoleFromEmail(account, fallback)
}
