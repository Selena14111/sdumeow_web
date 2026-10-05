import MockAdapter from 'axios-mock-adapter'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { httpClient } from '@/api/client'
import { getGroupQrcode } from '@/api/endpoints/community'

describe('community endpoints', () => {
  let mock: MockAdapter

  beforeEach(() => {
    mock = new MockAdapter(httpClient)
  })

  afterEach(() => {
    mock.restore()
  })

  it('fetches the group qrcode url', async () => {
    const qrcodeUrl = 'https://example.com/group-qrcode.jpg'
    mock.onGet('/community/group-qrcode').reply(200, {
      code: 200,
      msg: '获取成功',
      data: { qrcodeUrl },
    })

    const result = await getGroupQrcode()

    expect(result.code).toBe(200)
    expect(result.data?.qrcodeUrl).toBe(qrcodeUrl)
  })
})
