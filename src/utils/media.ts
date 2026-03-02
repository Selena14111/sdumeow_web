import { DEFAULT_API_BASE_URL } from '@/utils/constants'

export function normalizeMediaUrl(rawUrl: unknown): string {
  if (typeof rawUrl !== 'string') return ''
  const url = rawUrl.trim()
  if (!url) return ''

  if (/^https?:\/\//i.test(url) || /^data:/i.test(url) || /^blob:/i.test(url)) return url
  if (url.startsWith('//')) return `https:${url}`

  const baseUrl = String(import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL).replace(/\/+$/, '')
  if (!baseUrl) return url
  if (url.startsWith('/')) return `${baseUrl}${url}`
  return `${baseUrl}/${url}`
}
