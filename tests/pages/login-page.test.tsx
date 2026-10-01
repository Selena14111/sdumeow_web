import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LoginPage } from '@/pages/auth/LoginPage'
import { useAuthStore } from '@/store'
import { UserRole } from '@/types/enums'
import { STORAGE_KEYS } from '@/utils/constants'

const authApiMocks = vi.hoisted(() => ({
  buildAuthLoginUrl: vi.fn(() => 'https://meow.test/auth/login'),
  buildAuthAdminLoginUrl: vi.fn(() => 'https://meow.test/auth/admin-login'),
}))

const routerMocks = vi.hoisted(() => ({
  navigate: vi.fn(),
}))

vi.mock('@/api/endpoints/auth', () => ({
  buildAuthLoginUrl: authApiMocks.buildAuthLoginUrl,
  buildAuthAdminLoginUrl: authApiMocks.buildAuthAdminLoginUrl,
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => routerMocks.navigate,
  }
})

function renderLoginPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('LoginPage', () => {
  const originalAssign = window.location.assign

  beforeEach(() => {
    vi.clearAllMocks()
    useAuthStore.setState({ token: null, role: null, profile: null, hydrated: true })
    localStorage.clear()
    sessionStorage.clear()
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, assign: vi.fn() },
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, assign: originalAssign },
    })
    vi.restoreAllMocks()
  })

  it('starts unified auth from the user login endpoint', () => {
    renderLoginPage()

    fireEvent.click(screen.getByRole('button', { name: /山东大学统一认证登录/ }))

    expect(authApiMocks.buildAuthLoginUrl).toHaveBeenCalledWith({ platform: 'mobile' })
    expect(window.location.assign).toHaveBeenCalledWith('https://meow.test/auth/login')
  })

  it('starts admin unified auth from the admin login endpoint', () => {
    renderLoginPage()

    fireEvent.click(screen.getByRole('button', { name: /管理员登录/ }))

    expect(authApiMocks.buildAuthAdminLoginUrl).toHaveBeenCalledWith({ platform: 'mobile' })
    expect(window.location.assign).toHaveBeenCalledWith('https://meow.test/auth/admin-login')
  })

  it('enters guest mode without storing a token', () => {
    renderLoginPage()

    fireEvent.click(screen.getByRole('button', { name: '游客访问' }))

    expect(localStorage.getItem(STORAGE_KEYS.token)).toBeNull()
    expect(useAuthStore.getState().role).toBe(UserRole.Guest)
    expect(routerMocks.navigate).toHaveBeenCalledWith('/user/home', { replace: true })
  })

  it('shows login notice when redirected from protected features', async () => {
    sessionStorage.setItem(STORAGE_KEYS.authLoginNotice, '请登录使用功能')

    renderLoginPage()

    expect(await screen.findByText('请登录使用功能')).toBeInTheDocument()
    expect(screen.getByText('登录后即可继续使用该功能。')).toBeInTheDocument()
    expect(sessionStorage.getItem(STORAGE_KEYS.authLoginNotice)).toBeNull()
  })
})
