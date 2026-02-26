import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { RequireRole } from '@/router/guards'
import { useAuthStore } from '@/store'
import { UserRole } from '@/types/enums'

function toBase64Url(data: object): string {
  return btoa(JSON.stringify(data)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function createJwtWithExpiry(exp: number): string {
  return `${toBase64Url({ alg: 'HS256', typ: 'JWT' })}.${toBase64Url({ exp })}.signature`
}

describe('RequireRole', () => {
  it('renders children when role is allowed', async () => {
    useAuthStore.setState({ token: 'token', role: UserRole.User, profile: null, hydrated: true })

    render(
      <MemoryRouter initialEntries={['/secure']}>
        <Routes>
          <Route
            element={
              <RequireRole allow={[UserRole.User]}>
                <div>allowed content</div>
              </RequireRole>
            }
            path="/secure"
          />
          <Route element={<div>login page</div>} path="/login" />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('allowed content')).toBeInTheDocument()
  })

  it('redirects to login when role is missing', async () => {
    useAuthStore.setState({ token: null, role: null, profile: null, hydrated: true })

    render(
      <MemoryRouter initialEntries={['/secure']}>
        <Routes>
          <Route
            element={
              <RequireRole allow={[UserRole.User]}>
                <div>blocked content</div>
              </RequireRole>
            }
            path="/secure"
          />
          <Route element={<div>login page</div>} path="/login" />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('login page')).toBeInTheDocument()
    expect(screen.queryByText('blocked content')).not.toBeInTheDocument()
  })

  it('redirects to login when token is expired', async () => {
    const expiredToken = createJwtWithExpiry(Math.floor(Date.now() / 1000) - 60)
    useAuthStore.setState({ token: expiredToken, role: UserRole.User, profile: null, hydrated: true })

    render(
      <MemoryRouter initialEntries={['/secure']}>
        <Routes>
          <Route
            element={
              <RequireRole allow={[UserRole.User]}>
                <div>blocked content</div>
              </RequireRole>
            }
            path="/secure"
          />
          <Route element={<div>login page</div>} path="/login" />
        </Routes>
      </MemoryRouter>,
    )

    expect(await screen.findByText('login page')).toBeInTheDocument()
    expect(screen.queryByText('blocked content')).not.toBeInTheDocument()
  })
})
