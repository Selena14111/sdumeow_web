import { apiRequest } from '@/api/client'
import type { ApiResult } from '@/types/api'

export function getCats(params?: Record<string, unknown>): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/cats', params })
}

export function getCatDetail(catId: string): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: `/cats/${catId}` })
}

export function feedCat(catId: string): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'POST', url: `/cats/${catId}/feed` })
}

export function followCat(catId: string): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'POST', url: `/cats/${catId}/follow` })
}

export function unfollowCat(catId: string): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'DELETE', url: `/cats/${catId}/follow` })
}

export function createNewCat(payload: Record<string, unknown>): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'POST', url: '/new-cats', data: payload })
}
