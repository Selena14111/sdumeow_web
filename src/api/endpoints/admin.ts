import { apiRequest } from '@/api/client'
import type { ApiResult } from '@/types/api'

export function getAdminDashboardStats(): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/admin/dashboard/stats' })
}

export function getAdminUsers(): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/admin/users' })
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

export function getAdminAnnouncements(): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/admin/announcements' })
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
