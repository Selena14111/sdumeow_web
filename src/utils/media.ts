import { resolveFrontendBaseUrl } from '@/utils/baseUrls'

const DEFAULT_IMAGE_BASE_URL = 'https://sdu-meow-image-1384390902.cos.ap-beijing.myqcloud.com'

export function normalizeMediaUrl(rawUrl: unknown): string {
  if (typeof rawUrl !== 'string') return ''
  const url = rawUrl.trim()
  if (!url) return ''

  if (/^https?:\/\//i.test(url) || /^data:/i.test(url) || /^blob:/i.test(url)) return url
  if (url.startsWith('//')) return `https:${url}`

  const objectKey = url.replace(/^\/+/, '')
  if (/^(meow|cat|cats|post|posts|sos|avatar|avatars)\//i.test(objectKey)) {
    const imageBaseUrl = String(
      import.meta.env.VITE_IMAGE_BASE_URL ?? import.meta.env.VITE_COS_IMAGE_BASE_URL ?? DEFAULT_IMAGE_BASE_URL,
    ).replace(/\/+$/, '')
    return `${imageBaseUrl}/${objectKey}`
  }

  const baseUrl = resolveFrontendBaseUrl(import.meta.env.VITE_FRONTEND_BASE_URL)
  if (!baseUrl) return url
  if (url.startsWith('/')) return `${baseUrl}${url}`
  return `${baseUrl}/${url}`
}
