import { useMemo } from 'react'

import { useAuthStore } from '@/store'
import { UserRole } from '@/types/enums'
import { hasValidSession } from '@/utils/session'

export function useAuth() {
  const token = useAuthStore((state) => state.token)
  const role = useAuthStore((state) => state.role)
  const profile = useAuthStore((state) => state.profile)
  const hydrated = useAuthStore((state) => state.hydrated)
  const login = useAuthStore((state) => state.login)
  const logout = useAuthStore((state) => state.logout)
  const enterGuest = useAuthStore((state) => state.enterGuest)

  const isAuthenticated = hasValidSession(role, token)

  return useMemo(
    () => ({
      token,
      role,
      profile,
      hydrated,
      login,
      logout,
      enterGuest,
      isAuthenticated,
      isGuest: isAuthenticated && role === UserRole.Guest,
      isAdmin: isAuthenticated && role === UserRole.Admin,
      isUser: isAuthenticated && role === UserRole.User,
    }),
    [enterGuest, hydrated, isAuthenticated, login, logout, profile, role, token],
  )
}
