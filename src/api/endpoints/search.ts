import { apiRequest } from '@/api/client'
import type { ApiResult } from '@/types/api'

export type SearchParams = {
  keyword: string
  page?: number
  pageSize?: number
}

export function search(params: SearchParams): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/search', params })
}
