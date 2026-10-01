import { describe, expect, it } from 'vitest'

import { DEFAULT_API_BASE_URL, DEFAULT_FRONTEND_BASE_URL } from '@/utils/constants'
import { resolveApiBaseUrl, resolveFrontendBaseUrl } from '@/utils/baseUrls'

describe('base url resolution', () => {
  it('adds /api to a bare api base url', () => {
    expect(resolveApiBaseUrl(DEFAULT_FRONTEND_BASE_URL)).toBe(DEFAULT_API_BASE_URL)
  })

  it('keeps an explicit api base url unchanged', () => {
    expect(resolveApiBaseUrl(DEFAULT_API_BASE_URL)).toBe(DEFAULT_API_BASE_URL)
  })

  it('strips /api from a frontend base url if present', () => {
    expect(resolveFrontendBaseUrl(DEFAULT_API_BASE_URL)).toBe(DEFAULT_FRONTEND_BASE_URL)
  })
})
