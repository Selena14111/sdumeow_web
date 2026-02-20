import { apiRequest } from '@/api/client'
import type { ApiResult } from '@/types/api'

export function getAnnouncements(): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/announcements' })
}

export function getAnnouncementDetail(id: string): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: `/announcements/${id}` })
}
