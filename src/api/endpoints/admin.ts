import { apiRequest } from '@/api/client'
import { stripQueryContext } from '@/api/endpoints/utils'
import type { ApiResult } from '@/types/api'

export function getAdminDashboardStats(): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/admin/dashboard/stats' })
}

export type GetAdminUsersParams = {
  campus?: number
  search?: string
  page?: number
  size?: number
}

export function getAdminUsers(): Promise<ApiResult<Record<string, unknown>>>
export function getAdminUsers(params: GetAdminUsersParams): Promise<ApiResult<Record<string, unknown>>>
export function getAdminUsers(params?: GetAdminUsersParams): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/admin/users', params: stripQueryContext<GetAdminUsersParams>(params) })
}

export function getAdminUserDetail(id: string): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: `/admin/users/${id}` })
}

export function banAdminUser(id: string, payload: Record<string, unknown>): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'POST', url: `/admin/users/${id}/ban`, data: payload })
}

export function getAdminAudit(): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/admin/audit' })
}

export function runAdminAudit(id: string, payload: Record<string, unknown>): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'POST', url: `/admin/audit/${id}`, data: payload })
}

export type GetAdminAnnouncementsParams = {
  page?: number
  pageSize?: number
  size?: number
  type?: string | number
  status?: string
}

export function getAdminAnnouncements(): Promise<ApiResult<Record<string, unknown>>>
export function getAdminAnnouncements(params: GetAdminAnnouncementsParams): Promise<ApiResult<Record<string, unknown>>>
export function getAdminAnnouncements(params?: GetAdminAnnouncementsParams): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/admin/announcements', params: stripQueryContext<GetAdminAnnouncementsParams>(params) })
}

export function upsertAdminAnnouncement(payload: Record<string, unknown>, id?: string): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: id ? 'PUT' : 'POST', url: id ? `/admin/announcements/${id}` : '/admin/announcements', data: payload })
}

export function deleteAdminAnnouncement(id: string): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'DELETE', url: `/admin/announcements/${id}` })
}

export function getAdminCats(): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/admin/cats' })
}

export function upsertAdminCat(payload: Record<string, unknown>, id?: string): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: id ? 'PUT' : 'POST', url: id ? `/admin/cats/${id}` : '/admin/cats', data: payload })
}

export function deleteAdminCat(id: string): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'DELETE', url: `/admin/cats/${id}` })
}

export function getAdminCatImageKeys(id: string): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: `/admin/cats/${id}/image-keys` })
}

export type GetAdminNewCatsParams = {
  status?: string
  page?: number
  pageSize?: number
}

export function getAdminNewCats(): Promise<ApiResult<Record<string, unknown>>>
export function getAdminNewCats(params: GetAdminNewCatsParams): Promise<ApiResult<Record<string, unknown>>>
export function getAdminNewCats(params?: GetAdminNewCatsParams): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/admin/new-cats', params: stripQueryContext<GetAdminNewCatsParams>(params) })
}

export function approveAdminNewCat(id: string, payload: Record<string, unknown> = {}): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'POST', url: `/admin/new-cats/${id}/approve`, data: payload })
}

export function rejectAdminNewCat(id: string, payload: Record<string, unknown>): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'POST', url: `/admin/new-cats/${id}/reject`, data: payload })
}
