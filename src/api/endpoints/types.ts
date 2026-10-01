import { apiRequest } from '@/api/client'
import type { ApiResult } from '@/types/api'

export type BatchTypePayload = Array<Record<string, unknown> | string>

export function getTags(): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/type/tags' })
}

export function getSymptoms(): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/type/symptoms' })
}

export function getAnnouncementTypes(): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/type/announcement-types' })
}

export function getColors(): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/type/colors' })
}

export function getLocations(): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/type/locations' })
}

export function getRoles(): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/type/roles' })
}

export function batchCreateTags(payload: BatchTypePayload): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'POST', url: '/type/tags/batch', data: payload })
}

export function batchCreateSymptoms(payload: BatchTypePayload): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'POST', url: '/type/symptoms/batch', data: payload })
}

export function batchCreateColors(payload: BatchTypePayload): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'POST', url: '/type/colors/batch', data: payload })
}

export function batchCreateLocations(payload: BatchTypePayload): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'POST', url: '/type/locations/batch', data: payload })
}

export function batchCreateRoles(payload: BatchTypePayload): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'POST', url: '/type/roles/batch', data: payload })
}

export function deleteTag(id: string | number): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'DELETE', url: `/type/tags/${id}` })
}

export function deleteSymptom(id: string | number): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'DELETE', url: `/type/symptoms/${id}` })
}

export function deleteColor(id: string | number): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'DELETE', url: `/type/colors/${id}` })
}

export function deleteLocation(id: string | number): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'DELETE', url: `/type/locations/${id}` })
}

export function deleteRole(id: string | number): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'DELETE', url: `/type/roles/${id}` })
}
