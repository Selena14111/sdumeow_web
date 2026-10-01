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
  return apiRequest({ method: 'GET', url: '/posts', params })
}

export function publishMoment(payload: PublishMomentPayload): Promise<ApiResult<Record<string, unknown>>> {
  const { relatedCatIds, ...rest } = payload
  return apiRequest({
    method: 'POST',
    url: '/posts',
    data: {
      ...rest,
      catId: relatedCatIds,
    },
  })
}

export function likeMoment(id: string): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'POST', url: `/posts/${id}/like` })
}

export function unlikeMoment(id: string): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'DELETE', url: `/posts/${id}/like` })
}

export function deleteMoment(id: string): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'DELETE', url: `/posts/${id}` })
}
