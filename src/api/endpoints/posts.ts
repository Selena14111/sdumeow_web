import { apiRequest } from '@/api/client'
import type { ApiResult } from '@/types/api'

export type GetPostsParams = {
  page?: number
  pageSize?: number
  catId?: string
}

export type CreatePostPayload = {
  content?: string
  media?: string[]
  catId?: string
  location?: string
}

export function getPosts(params?: GetPostsParams): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/posts', params })
}

export function createPost(payload: CreatePostPayload): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'POST', url: '/posts', data: payload })
}

export function likePost(id: string): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'POST', url: `/posts/${id}/like` })
}

export function unlikePost(id: string): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'DELETE', url: `/posts/${id}/like` })
}

export function deletePost(id: string): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'DELETE', url: `/posts/${id}` })
}
