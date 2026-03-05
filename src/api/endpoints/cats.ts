import { apiRequest } from '@/api/client'
import { buildFormData } from '@/api/formData'
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

export type CreateNewCatPayload = {
  tempName?: string
  color: string
  images: File[]
  campus: number
  location: string
  tags?: string[]
  attributes?: {
    friendliness: number
    gluttony: number
    fight: number
    appearance: number
  }
  attributeScore?: {
    friendliness: number
    gluttony: number
    fight: number
    appearance: number
  }
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

export function createNewCat(payload: CreateNewCatPayload): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'POST', url: '/new-cats', data: buildFormData(payload as Record<string, unknown>) })
}
