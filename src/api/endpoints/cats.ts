import { apiRequest } from '@/api/client'
import type { ApiResult } from '@/types/api'
import type { CatDetail, CatListResult } from '@/types/domain'

export type GetCatsParams = {
  page?: number
  pageSize?: number
  campus?: number | string
  status?: string
  color?: string
  search?: string
  sort?: string
}

export function getCats(params?: GetCatsParams): Promise<ApiResult<CatListResult>> {
  return apiRequest({ method: 'GET', url: '/cats', params })
}

export function getCatDetail(catId: string): Promise<ApiResult<CatDetail>> {
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
