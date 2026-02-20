import type { PropsWithChildren } from 'react'

import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '@/hooks/useAuth'
import type { UserRole } from '@/types/enums'

type RequireRoleProps = PropsWithChildren<{
  allow: UserRole[]
}>

export function RequireRole({ allow, children }: RequireRoleProps) {
  const { role, hydrated } = useAuth()
  const location = useLocation()

  if (!hydrated) {
    return null
  }

  if (!role) {
    return <Navigate replace state={{ from: location.pathname }} to="/login" />
  }

  if (!allow.includes(role)) {
    return <Navigate replace to="/login" />
  }

  return <>{children}</>
}
