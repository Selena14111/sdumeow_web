import { apiRequest } from '@/api/client'
import type { ApiResult } from '@/types/api'

export function createAdoption(payload: Record<string, unknown>): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'POST', url: '/adoptions', data: payload })
}

export function getMyAdoptions(): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/adoptions/my' })
}

export function getAdminAdoptions(): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/admin/adoptions' })
}

export function auditAdoption(id: string, payload: Record<string, unknown>): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'POST', url: `/admin/adoptions/${id}/audit`, data: payload })
}

export function scheduleAdoption(id: string, payload: Record<string, unknown>): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'POST', url: `/admin/adoptions/${id}/schedule`, data: payload })
}
