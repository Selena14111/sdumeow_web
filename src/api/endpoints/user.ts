import { apiRequest } from '@/api/client'
import type { ApiResult } from '@/types/api'

export function getMe(): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/users/me' })
}

export function updateMe(payload: Record<string, unknown>): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'PUT', url: '/users/me', data: payload })
}

export function checkin(): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'POST', url: '/users/me/checkin' })
}

export function getCheckinHistory(): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/users/me/checkin/history' })
}

export function getBadges(): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/users/me/badges' })
}

export function getSettings(): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/users/me/settings' })
}

export function updateSettings(payload: Record<string, unknown>): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'PUT', url: '/users/me/settings', data: payload })
}

export function getFollowedCats(): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/users/me/followed-cats' })
}
