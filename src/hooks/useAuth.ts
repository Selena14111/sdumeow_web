import { useMemo } from 'react'

import { useAuthStore } from '@/store'
import { UserRole } from '@/types/enums'

export function useAuth() {
  const token = useAuthStore((state) => state.token)
  const role = useAuthStore((state) => state.role)
  const profile = useAuthStore((state) => state.profile)
  const hydrated = useAuthStore((state) => state.hydrated)
  const login = useAuthStore((state) => state.login)
  const logout = useAuthStore((state) => state.logout)
  const enterGuest = useAuthStore((state) => state.enterGuest)

  return useMemo(
    () => ({
      token,
      role,
      profile,
      hydrated,
      login,
      logout,
      enterGuest,
      isAuthenticated: role !== null,
      isGuest: role === UserRole.Guest,
      isAdmin: role === UserRole.Admin,
      isUser: role === UserRole.User,
    }),
    [enterGuest, hydrated, login, logout, profile, role, token],
  )
}
