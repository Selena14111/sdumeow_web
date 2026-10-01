import type { PropsWithChildren } from 'react'

import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '@/hooks/useAuth'
import { UserRole, type UserRole as UserRoleType } from '@/types/enums'
import { hasValidSession } from '@/utils/session'

type RequireRoleProps = PropsWithChildren<{
  allow: UserRoleType[]
}>

function canAccess(role: UserRoleType, allow: UserRoleType[]): boolean {
  if (allow.includes(role)) {
    return true
  }

  // Admin inherits all user capabilities.
  if (role === UserRole.Admin && allow.includes(UserRole.User)) {
    return true
  }

  return false
}

export function RequireRole({ allow, children }: RequireRoleProps) {
  const { role, token, hydrated } = useAuth()
  const location = useLocation()
  const loginState = {
    from: `${location.pathname}${location.search}`,
    loginNotice: '请登录使用功能',
  }

  if (!hydrated) {
    return null
  }

  if (!hasValidSession(role, token)) {
    return <Navigate replace state={loginState} to="/login" />
  }

  if (!role) {
    return <Navigate replace state={loginState} to="/login" />
  }

  if (!canAccess(role, allow)) {
    return <Navigate replace state={loginState} to="/login" />
  }

  return <>{children}</>
}
