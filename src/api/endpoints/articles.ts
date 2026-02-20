import { apiRequest } from '@/api/client'
import type { ApiResult } from '@/types/api'

export function getArticles(): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/articles' })
}

export function getArticleDetail(id: string): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: `/articles/${id}` })
}

export function upsertAdminArticle(payload: Record<string, unknown>, id?: string): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: id ? 'PUT' : 'POST', url: id ? `/admin/articles/${id}` : '/admin/articles', data: payload })
}

export function getAdminArticles(): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/admin/articles' })
}
