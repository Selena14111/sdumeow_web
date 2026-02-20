import { apiRequest } from '@/api/client'
import type { ApiResult } from '@/types/api'

export function getMoments(): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/moments' })
}

export function publishMoment(payload: Record<string, unknown>): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'POST', url: '/moments', data: payload })
}

export function likeMoment(id: string): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'POST', url: `/moments/${id}/like` })
}
