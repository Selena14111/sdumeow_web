import { beforeEach, describe, expect, it } from 'vitest'

import { useAuthStore } from '@/store'
import { UserRole } from '@/types/enums'

describe('auth store', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, role: null, profile: null, hydrated: true })
    localStorage.clear()
  })

  it('enters guest mode', () => {
    useAuthStore.getState().enterGuest()
    const state = useAuthStore.getState()

    expect(state.role).toBe(UserRole.Guest)
    expect(state.token).toBeNull()
  })

  it('clears session on logout', () => {
    useAuthStore.getState().login({ token: 'mock-token', role: UserRole.User, profile: { nickname: 'demo' } })
    useAuthStore.getState().logout()

    const state = useAuthStore.getState()
    expect(state.role).toBeNull()
    expect(state.token).toBeNull()
    expect(state.profile).toBeNull()
  })
})
