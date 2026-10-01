import { describe, expect, it } from 'vitest'

import { DEFAULT_FRONTEND_BASE_URL } from '@/utils/constants'
import { normalizeMediaUrl } from '@/utils/media'

describe('media url normalization', () => {
  it('routes generic relative urls to the frontend base', () => {
    expect(normalizeMediaUrl('/assets/logo.png')).toBe(`${DEFAULT_FRONTEND_BASE_URL}/assets/logo.png`)
  })

  it('keeps known image keys on the image base', () => {
    expect(normalizeMediaUrl('/avatar/user-1.png')).toBe(
      'https://sdu-meow-image-1384390902.cos.ap-beijing.myqcloud.com/avatar/user-1.png',
    )
  })
})
