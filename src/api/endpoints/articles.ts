import { apiRequest } from '@/api/client'
import type { ApiResult } from '@/types/api'

export function getArticles(): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/articles' })
}

export function getArticleDetail(id: string): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: `/articles/${id}` })
}
