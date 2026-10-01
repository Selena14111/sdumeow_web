import MockAdapter from 'axios-mock-adapter'
import { describe, expect, it } from 'vitest'

import { ApiNotFoundError } from '@/api/adapters/errors'
import { apiRequest, httpClient } from '@/api/client'
import { useAuthStore } from '@/store'
import { UserRole } from '@/types/enums'
import { storage } from '@/utils/storage'

describe('api client', () => {
  it('normalizes response envelope', async () => {
    const mock = new MockAdapter(httpClient)
    mock.onGet('/ok').reply(200, { code: 200, msg: 'success', data: { value: 1 } })

    const result = await apiRequest<{ value: number }>({ method: 'GET', url: '/ok' })

    expect(result.code).toBe(200)
    expect(result.message).toBe('success')
    expect(result.data).toEqual({ value: 1 })

    mock.restore()
  })

  it('throws ApiNotFoundError when endpoint is missing', async () => {
    const mock = new MockAdapter(httpClient)
    mock.onGet('/missing').reply(404, { code: 404, msg: 'not found' })

    await expect(apiRequest({ method: 'GET', url: '/missing' })).rejects.toBeInstanceOf(ApiNotFoundError)

    mock.restore()
  })

  it('clears auth session when 401 is returned for authenticated request', async () => {
    const mock = new MockAdapter(httpClient)
    window.history.pushState({}, '', '/login')
    storage.setToken('token')
    useAuthStore.setState({ token: 'token', role: UserRole.User, profile: null, hydrated: true })
    mock.onGet('/protected').reply(401, { code: 401, msg: 'unauthorized' })

    await expect(apiRequest({ method: 'GET', url: '/protected' })).rejects.toBeTruthy()

    expect(storage.getToken()).toBeNull()
    expect(useAuthStore.getState().role).toBeNull()

    mock.restore()
  })
})
