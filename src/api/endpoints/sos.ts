import { apiRequest } from '@/api/client'
import type { ApiResult } from '@/types/api'

export function createSos(payload: Record<string, unknown>): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'POST', url: '/sos', data: payload })
}

export function getSosTags(): Promise<ApiResult<string[]>> {
  return apiRequest({ method: 'GET', url: '/sos/tags' })
}

export function getMySos(): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/sos/my' })
}

export function getAdminSos(): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/admin/sos' })
}

export function resolveSos(id: string, payload: Record<string, unknown>): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'POST', url: `/admin/sos/${id}/resolve`, data: payload })
}
