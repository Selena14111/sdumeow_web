import { Navigate } from 'react-router-dom'

import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types/enums'
import { hasValidSession } from '@/utils/session'

export function LandingRedirect() {
  const { role, token, hydrated } = useAuth()

  if (!hydrated) {
    return null
  }

  if (!hasValidSession(role, token)) {
    return <Navigate replace to="/login" />
  }

  if (role === UserRole.Admin) {
    return <Navigate replace to="/admin/home" />
  }

  if (role === UserRole.User || role === UserRole.Guest) {
    return <Navigate replace to="/user/home" />
  }

  return <Navigate replace to="/login" />
}
