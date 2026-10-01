import { useEffect, useRef } from 'react'

import { message } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

import { getMe } from '@/api/endpoints/user'
import { useAuthStore } from '@/store'
import { UserRole } from '@/types/enums'
import { inferRoleFromProfile, inferRoleFromToken } from '@/utils/auth'
import { STORAGE_KEYS } from '@/utils/constants'
import { asNumber, asRecord, asString } from '@/utils/format'
import { storage } from '@/utils/storage'

function buildProfile(profileData: unknown, role: UserRole) {
  const me = asRecord(profileData)
  const stats = asRecord(me.stats)
  const id = asString(me.id || me.uid)
  const avatar = asString(me.avatar)
  const studentId = asString(me.studentId || me.sid)
  const campus = asString(me.campus)
  const level = asNumber(me.level, 0)

  return {
    id: id || undefined,
    nickname: asString(me.nickname || me.name || me.email, 'SDU Meow 用户'),
    avatar: avatar || undefined,
    studentId: studentId || undefined,
    campus: campus || undefined,
    level: level > 0 ? level : undefined,
    currency: asNumber(me.currency, asNumber(stats.fishPoints, asNumber(stats.points, asNumber(stats.score, 0)))),
    role,
  }
}

function readPendingAuthRole(params: URLSearchParams): UserRole | null {
  const mode =
    params.get('auth_mode') ||
    params.get('login_mode') ||
    params.get('meow_role') ||
    sessionStorage.getItem(STORAGE_KEYS.authLoginMode) ||
    localStorage.getItem(STORAGE_KEYS.authLoginMode)
  sessionStorage.removeItem(STORAGE_KEYS.authLoginMode)
  localStorage.removeItem(STORAGE_KEYS.authLoginMode)
  if (mode === 'admin') return UserRole.Admin
  if (mode === 'user') return UserRole.User
  return null
}

function AuthCallbackHandler() {
  const location = useLocation()
  const navigate = useNavigate()
  const handledCallbackRef = useRef<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const token = params.get('meow_token')?.trim()
    const refreshToken = params.get('meow_refresh_token')?.trim()

    if (!token) {
      return
    }

    const callbackKey = `${location.pathname}${location.search}`
    if (handledCallbackRef.current === callbackKey) {
      return
    }
    handledCallbackRef.current = callbackKey

    const pendingRole = readPendingAuthRole(params)

    params.delete('meow_token')
    params.delete('meow_refresh_token')
    params.delete('auth_mode')
    params.delete('login_mode')
    params.delete('meow_role')
    const cleanSearch = params.toString()
    window.history.replaceState(null, '', `${location.pathname}${cleanSearch ? `?${cleanSearch}` : ''}${location.hash}`)

    storage.setTokens({ token, refreshToken })

    const tokenRole = inferRoleFromToken(token, UserRole.User)
    const seedRole = pendingRole ?? tokenRole

    void getMe()
      .then((result) => {
        const inferredRole = inferRoleFromProfile(result.data, inferRoleFromToken(token, UserRole.User))
        const role = pendingRole === UserRole.Admin ? UserRole.Admin : inferredRole

        if (pendingRole === UserRole.Admin && inferredRole !== UserRole.Admin) {
          storage.clearToken()
          useAuthStore.getState().logout()
          window.sessionStorage.setItem(STORAGE_KEYS.authLoginNotice, '无管理员权限')
          navigate('/login', { replace: true, state: { loginNotice: '无管理员权限' } })
          return
        }

        useAuthStore.getState().login({
          token,
          role,
          profile: buildProfile(result.data, role),
        })
        message.success('登录成功')
        navigate(role === UserRole.Admin ? '/admin/home' : '/user/home', { replace: true })
      })
      .catch(() => {
        if (pendingRole === UserRole.Admin && tokenRole !== UserRole.Admin) {
          storage.clearToken()
          useAuthStore.getState().logout()
          window.sessionStorage.setItem(STORAGE_KEYS.authLoginNotice, '无管理员权限')
          navigate('/login', { replace: true, state: { loginNotice: '无管理员权限' } })
          return
        }

        useAuthStore.getState().login({ token, role: seedRole })
        navigate(seedRole === UserRole.Admin ? '/admin/home' : '/user/home', { replace: true })
        message.success('登录成功')
      })
  }, [location.hash, location.pathname, location.search, navigate])

  return null
}

export function AppRootLayout() {
  const location = useLocation()
  const isAuthCallback = new URLSearchParams(location.search).has('meow_token')

  return (
    <div className="min-h-screen bg-[#e0e5ec]">
      <AuthCallbackHandler />
      {isAuthCallback ? (
        <div className="flex min-h-screen items-center justify-center text-sm text-[#666]">正在完成登录...</div>
      ) : (
        <Outlet />
      )}
    </div>
  )
}
