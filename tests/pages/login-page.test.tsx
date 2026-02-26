import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LoginPage } from '@/pages/auth/LoginPage'
import { useAuthStore } from '@/store'
import { STORAGE_KEYS } from '@/utils/constants'

const authApiMocks = vi.hoisted(() => ({
  adminLogin: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
  sendVerificationCode: vi.fn(),
}))

const routerMocks = vi.hoisted(() => ({
  navigate: vi.fn(),
}))

vi.mock('@/api/endpoints/auth', () => ({
  adminLogin: authApiMocks.adminLogin,
  login: authApiMocks.login,
  register: authApiMocks.register,
  sendVerificationCode: authApiMocks.sendVerificationCode,
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
  beforeEach(() => {
    vi.clearAllMocks()
    authApiMocks.adminLogin.mockRejectedValue(new Error('not admin'))
    useAuthStore.setState({ token: null, role: null, profile: null, hydrated: true })
    localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  it('blocks submit when email format is invalid', async () => {
    renderLoginPage()

    fireEvent.change(screen.getByPlaceholderText('请输入山东大学邮箱'), { target: { value: 'invalid-email' } })
    fireEvent.change(screen.getByPlaceholderText('密码'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: /登录$/ }))

    await waitFor(() => {
      expect(authApiMocks.login).not.toHaveBeenCalled()
    })
  })

  it('does not store session when login response has no accessToken', async () => {
    authApiMocks.login.mockResolvedValue({
      code: 200,
      message: 'ok',
      data: {},
      raw: {},
    })

    renderLoginPage()

    fireEvent.change(screen.getByPlaceholderText('请输入山东大学邮箱'), { target: { value: 'user@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('密码'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: /登录$/ }))

    await waitFor(() => {
      expect(authApiMocks.login).toHaveBeenCalled()
    })

    expect(authApiMocks.login.mock.calls[0]?.[0]).toEqual({ email: 'user@example.com', password: '123456' })
    expect(localStorage.getItem(STORAGE_KEYS.token)).toBeNull()
    expect(useAuthStore.getState().role).toBeNull()
    expect(routerMocks.navigate).not.toHaveBeenCalled()
  })

  it('returns to login tab and prefills email after register success', async () => {
    authApiMocks.register.mockResolvedValue({
      code: 200,
      message: 'ok',
      data: {},
      raw: {},
    })

    renderLoginPage()

    fireEvent.click(screen.getByRole('tab', { name: '注册' }))
    fireEvent.change(screen.getByPlaceholderText('请输入山东大学邮箱'), { target: { value: 'new@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('验证码'), { target: { value: '666666' } })
    fireEvent.change(screen.getByPlaceholderText('密码'), { target: { value: '123456' } })
    fireEvent.change(screen.getByPlaceholderText('确认密码'), { target: { value: '123456' } })
    fireEvent.click(screen.getByRole('button', { name: /注\s*册/ }))

    await waitFor(() => {
      expect(authApiMocks.register).toHaveBeenCalled()
    })

    expect(authApiMocks.register.mock.calls[0]?.[0]).toEqual({
      email: 'new@example.com',
      code: '666666',
      password: '123456',
    })

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: '登录' })).toHaveAttribute('aria-selected', 'true')
    })

    expect((screen.getByPlaceholderText('请输入山东大学邮箱') as HTMLInputElement).value).toBe('new@example.com')
  })

  it('starts countdown after sending verification code', async () => {
    authApiMocks.sendVerificationCode.mockResolvedValue({
      code: 200,
      message: 'ok',
      data: {},
      raw: {},
    })

    renderLoginPage()

    fireEvent.click(screen.getByRole('tab', { name: '注册' }))
    fireEvent.change(screen.getByPlaceholderText('请输入山东大学邮箱'), { target: { value: 'new@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: '发送验证码' }))

    await waitFor(() => {
      expect(authApiMocks.sendVerificationCode).toHaveBeenCalled()
    })

    expect(authApiMocks.sendVerificationCode.mock.calls[0]?.[0]).toEqual({ email: 'new@example.com' })
    expect(await screen.findByRole('button', { name: /\d+s/ })).toBeDisabled()
  })

  it('shows inline password error when login fails due to wrong password', async () => {
    authApiMocks.login.mockRejectedValue(new Error('密码错误'))

    renderLoginPage()

    fireEvent.change(screen.getByPlaceholderText('请输入山东大学邮箱'), { target: { value: 'user@example.com' } })
    fireEvent.change(screen.getByPlaceholderText('密码'), { target: { value: 'wrong-password' } })
    fireEvent.click(screen.getByRole('button', { name: /登录$/ }))

    await waitFor(() => {
      expect(authApiMocks.login).toHaveBeenCalled()
    })

    expect(await screen.findByText('密码错误')).toBeInTheDocument()
  })

  it('auto completes @mail.sdu.edu.cn after typing @ or 12-digit student id', async () => {
    renderLoginPage()

    fireEvent.change(screen.getByPlaceholderText('请输入山东大学邮箱'), { target: { value: '202400300000' } })
    expect((screen.getByPlaceholderText('请输入山东大学邮箱') as HTMLInputElement).value).toBe('202400300000@mail.sdu.edu.cn')

    fireEvent.change(screen.getByPlaceholderText('请输入山东大学邮箱'), { target: { value: '202400300001@' } })
    expect((screen.getByPlaceholderText('请输入山东大学邮箱') as HTMLInputElement).value).toBe('202400300001@mail.sdu.edu.cn')

    fireEvent.click(screen.getByRole('tab', { name: '注册' }))
    fireEvent.change(screen.getByPlaceholderText('请输入山东大学邮箱'), { target: { value: '202400300002@' } })
    expect((screen.getByPlaceholderText('请输入山东大学邮箱') as HTMLInputElement).value).toBe('202400300002@mail.sdu.edu.cn')
  })
})
