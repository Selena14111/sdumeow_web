import { apiRequest } from '@/api/client'
import { buildFormData } from '@/api/formData'
import type { ApiResult } from '@/types/api'
import type { UserProfile } from '@/types/domain'

export type UserContact = {
  wechat?: string
  phone?: string
}

export type UserMeProfile = UserProfile & {
  uid?: number
  id?: string
  slogan?: string
  sid?: string
  studentId?: string
  realName?: string
  campus?: string | number
  level?: number
  title?: string
  exp?: number
  nextExp?: number
  currency?: number
  stats?: {
    feedCount?: number
    found?: number
    foundNewCatCount?: number
    receivedLikes?: number
    momentCount?: number
  }
  contact?: UserContact
  wechat?: string
  phone?: string
}

export type UpdateMePayload = {
  nickname: string
  avatar?: string
  avatarFile?: File | null
  campus: string
  contact: {
    wechat: string
    phone: string
  }
}

export function getMe(): Promise<ApiResult<UserMeProfile>> {
  return apiRequest({ method: 'GET', url: '/users/me' })
}

export function updateMe(payload: UpdateMePayload): Promise<ApiResult<Record<string, unknown>>> {
  const { avatarFile, ...rest } = payload
  if (avatarFile) {
    return apiRequest({
      method: 'PUT',
      url: '/users/me',
      data: buildFormData({
        ...rest,
        avatar: avatarFile,
      }),
    })
  }

  return apiRequest({ method: 'PUT', url: '/users/me', data: rest })
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
