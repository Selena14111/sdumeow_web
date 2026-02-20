import MockAdapter from 'axios-mock-adapter'
import { describe, expect, it } from 'vitest'

import { ApiNotFoundError } from '@/api/adapters/errors'
import { apiRequest, httpClient } from '@/api/client'

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
})
