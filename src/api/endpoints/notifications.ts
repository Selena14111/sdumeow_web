import { apiRequest } from '@/api/client'
import type { ApiResult } from '@/types/api'

export type GetNotificationsParams = {
  type?: string
  isRead?: boolean
  page?: number
  pageSize?: number
}

export function getNotifications(params?: GetNotificationsParams): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/notifications', params })
}

export function markNotificationAsRead(id: string): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'POST', url: `/notifications/${id}/read` })
}

export function markAllNotificationsAsRead(): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'POST', url: '/notifications/read-all' })
}
