import { apiRequest } from '@/api/client'
import { stripQueryContext } from '@/api/endpoints/utils'
import type { ApiResult } from '@/types/api'

export type GetAnnouncementsParams = {
  page?: number
  pageSize?: number
  type?: string | number
}

export function getAnnouncements(params?: GetAnnouncementsParams): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/announcements', params: stripQueryContext<GetAnnouncementsParams>(params) })
}

export function getAnnouncementDetail(id: string): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: `/announcements/${id}` })
}
