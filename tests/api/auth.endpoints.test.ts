import MockAdapter from 'axios-mock-adapter'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { httpClient } from '@/api/client'
import { changePassword, forgotPassword, login, register, sendVerificationCode } from '@/api/endpoints/auth'
import { storage } from '@/utils/storage'

describe('auth endpoints', () => {
  let mock: MockAdapter

  beforeEach(() => {
    mock = new MockAdapter(httpClient)
    storage.clearToken()
  })

  afterEach(() => {
    mock.restore()
  })

  it('sends email/password payload for login', async () => {
    const payload = { email: 'user@example.com', password: '123456' }
    mock.onPost('/users/login', payload).reply(200, {
      code: 200,
      msg: 'ok',
      data: { accessToken: 'token' },
    })

    const result = await login(payload)

    expect(result.data?.accessToken).toBe('token')
  })

  it('sends email/password/code payload for register', async () => {
    const payload = { email: 'user@example.com', password: '123456', code: '888888' }
    mock.onPost('/users/register', payload).reply(200, {
      code: 200,
      msg: 'ok',
      data: {},
    })

    const result = await register(payload)

    expect(result.code).toBe(200)
  })

  it('calls send verification endpoint', async () => {
    const payload = { email: 'user@example.com' }
    mock.onPost('/users/send-verification-code', payload).reply(200, {
      code: 200,
      msg: 'ok',
      data: {},
    })

    const result = await sendVerificationCode(payload)

    expect(result.code).toBe(200)
  })

  it('calls change-password endpoint', async () => {
    const payload = { oldPassword: '123456', newPassword: '654321', confirmPassword: '654321' }
    mock.onPost('/users/change-password', payload).reply(200, {
      code: 200,
      msg: 'ok',
      data: {},
    })

    const result = await changePassword(payload)

    expect(result.code).toBe(200)
  })

  it('calls forgot-password endpoint', async () => {
    const payload = { email: 'user@example.com', code: '123456', newPassword: '654321', confirmPassword: '654321' }
    mock.onPost('/users/change-password', payload).reply(200, {
      code: 200,
      msg: 'ok',
      data: {},
    })

    const result = await forgotPassword(payload)

    expect(result.code).toBe(200)
  })
})
