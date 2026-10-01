import { apiRequest } from '@/api/client'
import { stripQueryContext } from '@/api/endpoints/utils'
import type { ApiResult } from '@/types/api'

export type CreateSosPayload = {
  catId?: string
  campus: number
  location: string
  symptoms: number[]
  description: string
  media?: string[]
  medium?: string[]
}

export function createSos(payload: CreateSosPayload): Promise<ApiResult<Record<string, unknown>>> {
  const { media, medium, ...rest } = payload
  return apiRequest({ method: 'POST', url: '/sos', data: { ...rest, medium: medium ?? media ?? [] } })
}

export type GetMySosParams = {
  status?: string
  page?: number
  size?: number
}

export function getMySos(): Promise<ApiResult<Record<string, unknown>>>
export function getMySos(params: GetMySosParams): Promise<ApiResult<Record<string, unknown>>>
export function getMySos(params?: GetMySosParams): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/sos/my', params: stripQueryContext<GetMySosParams>(params) })
}

export type GetAdminSosParams = GetMySosParams & {
  campus?: number
}

export function getAdminSos(): Promise<ApiResult<Record<string, unknown>>>
export function getAdminSos(params: GetAdminSosParams): Promise<ApiResult<Record<string, unknown>>>
export function getAdminSos(params?: GetAdminSosParams): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/admin/sos', params: stripQueryContext<GetAdminSosParams>(params) })
}

export function resolveSos(id: string, payload: Record<string, unknown>): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'POST', url: `/admin/sos/${id}/resolve`, data: payload })
}
