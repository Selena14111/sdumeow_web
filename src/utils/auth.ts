import { UserRole } from '@/types/enums'

export function inferRoleFromAccount(account: string, fallback = UserRole.User): UserRole {
  if (account.toLowerCase().includes('admin')) {
    return UserRole.Admin
  }

  return fallback
}
