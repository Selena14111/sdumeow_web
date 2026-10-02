import { render, waitFor } from '@testing-library/react'
import { StrictMode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { AppRootLayout } from '@/layouts/AppRootLayout'
import type * as AuthEndpoints from '@/api/endpoints/auth'
import { useAuthStore } from '@/store'
import { UserRole } from '@/types/enums'
import { STORAGE_KEYS } from '@/utils/constants'

const userApiMocks = vi.hoisted(() => ({
  getMe: vi.fn(),
}))

const authApiMocks = vi.hoisted(() => ({
  exchangeLoginCode: vi.fn(),
}))

const routerMocks = vi.hoisted(() => ({
  navigate: vi.fn(),
}))

vi.mock('@/api/endpoints/user', () => ({
  getMe: userApiMocks.getMe,
}))

vi.mock('@/api/endpoints/auth', async () => {
  const actual = await vi.importActual<typeof AuthEndpoints>('@/api/endpoints/auth')
  return {
    ...actual,
    exchangeLoginCode: authApiMocks.exchangeLoginCode,
  }
})

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => routerMocks.navigate,
  }
})

vi.mock('antd', async () => {
  const actual = await vi.importActual('antd')
  return {
    ...actual,
    message: { success: vi.fn() },
  }
})

function renderAuthCallback() {
  return render(
    <StrictMode>
      <MemoryRouter initialEntries={['/?login_code=login-code-1']}>
        <AppRootLayout />
      </MemoryRouter>
    </StrictMode>,
  )
}

describe('AppRootLayout auth callback', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    sessionStorage.clear()
    useAuthStore.setState({ token: null, role: null, profile: null, hydrated: true })
    authApiMocks.exchangeLoginCode.mockResolvedValue({
      code: 200,
      msg: '登录成功',
      data: { accessToken: 'access-token', refreshToken: 'refresh-token', expiresIn: 1800, refreshExpiresIn: 7200 },
    })
  })

  it('routes admin callbacks to the admin home page', async () => {
    userApiMocks.getMe.mockResolvedValue({
      code: 200,
      msg: 'ok',
      data: { role: 'admin', nickname: 'Admin' },
    })

    renderAuthCallback()

    await waitFor(() => {
      expect(routerMocks.navigate).toHaveBeenCalledWith('/admin/home', { replace: true })
    })
    expect(routerMocks.navigate).not.toHaveBeenCalledWith('/user/home', { replace: true })
    expect(useAuthStore.getState().role).toBe(UserRole.Admin)
    expect(userApiMocks.getMe).toHaveBeenCalledTimes(1)
    expect(authApiMocks.exchangeLoginCode).toHaveBeenCalledWith({ loginCode: 'login-code-1' })
    expect(localStorage.getItem(STORAGE_KEYS.token)).toBe('access-token')
    expect(localStorage.getItem(STORAGE_KEYS.refreshToken)).toBe('refresh-token')
  })

  it('routes user callbacks to the user home page', async () => {
    userApiMocks.getMe.mockResolvedValue({
      code: 200,
      msg: 'ok',
      data: { role: 'user', nickname: 'User' },
    })

    renderAuthCallback()

    await waitFor(() => {
      expect(routerMocks.navigate).toHaveBeenCalledWith('/user/home', { replace: true })
    })
    expect(useAuthStore.getState().role).toBe(UserRole.User)
  })

  it('uses the pending admin login mode when handling auth callbacks', async () => {
    localStorage.setItem(STORAGE_KEYS.authLoginMode, 'admin')
    userApiMocks.getMe.mockResolvedValue({
      code: 200,
      msg: 'ok',
      data: { role: 'user', nickname: 'Admin' },
    })

    renderAuthCallback()

    await waitFor(() => {
      expect(routerMocks.navigate).toHaveBeenCalledWith('/admin/home', { replace: true })
    })
    expect(useAuthStore.getState().role).toBe(UserRole.Admin)
    expect(sessionStorage.getItem(STORAGE_KEYS.authLoginMode)).toBeNull()
    expect(localStorage.getItem(STORAGE_KEYS.authLoginMode)).toBeNull()
  })
})
