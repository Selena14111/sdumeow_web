import { DEFAULT_API_BASE_URL, DEFAULT_FRONTEND_BASE_URL } from '@/utils/constants'

const API_SUFFIX = '/api'

function trimTrailingSlashes(value: string): string {
  return value.replace(/\/+$/, '')
}

function normalizeBaseUrl(rawBaseUrl: string | null | undefined, fallback: string): string {
  const candidate = rawBaseUrl?.trim() || fallback
  return trimTrailingSlashes(candidate)
}

export function resolveApiBaseUrl(rawBaseUrl: string | null | undefined): string {
  const baseUrl = normalizeBaseUrl(rawBaseUrl, DEFAULT_API_BASE_URL)
  return baseUrl.endsWith(API_SUFFIX) ? baseUrl : `${baseUrl}${API_SUFFIX}`
}

export function resolveFrontendBaseUrl(rawBaseUrl: string | null | undefined): string {
  const baseUrl = normalizeBaseUrl(rawBaseUrl, DEFAULT_FRONTEND_BASE_URL)
  return baseUrl.endsWith(API_SUFFIX) ? baseUrl.slice(0, -API_SUFFIX.length) : baseUrl
}
