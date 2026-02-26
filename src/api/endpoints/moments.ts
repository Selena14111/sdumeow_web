import { apiRequest } from '@/api/client'
import type { ApiResult } from '@/types/api'

export type GetMomentsParams = {
  page?: number
  pageSize?: number
  catId?: string
}

export type PublishMomentPayload = {
  content?: string
  media?: string[]
  relatedCatIds: string
  location?: string
}

export function getMoments(params?: GetMomentsParams): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/moments', params })
}

export function publishMoment(payload: PublishMomentPayload): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'POST', url: '/moments', data: payload })
}

export function likeMoment(id: string): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'POST', url: `/moments/${id}/like` })
}
