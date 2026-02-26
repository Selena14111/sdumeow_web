import { apiRequest } from '@/api/client'
import type { ApiResult, Paged } from '@/types/api'
import type { AdminAdoptionRecord, AdoptionRecord } from '@/types/domain'

export type CreateAdoptionPayload = Record<string, unknown>

export type GetAdoptionsParams = {
  status?: string
  page?: number
  size?: number
}

export type AuditAdoptionPayload = {
  status: 'APPROVED' | 'REJECTED'
  reason?: string
}

export type ScheduleAdoptionPayload = {
  time: string
  location: string
}

export function createAdoption(payload: CreateAdoptionPayload): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'POST', url: '/adoptions', data: payload })
}

export function getMyAdoptions(): Promise<ApiResult<Paged<AdoptionRecord>>>
export function getMyAdoptions(params: GetAdoptionsParams): Promise<ApiResult<Paged<AdoptionRecord>>>
export function getMyAdoptions(params?: GetAdoptionsParams): Promise<ApiResult<Paged<AdoptionRecord>>> {
  return apiRequest({ method: 'GET', url: '/adoptions/my', params })
}

export function getAdminAdoptions(): Promise<ApiResult<Paged<AdminAdoptionRecord>>>
export function getAdminAdoptions(params: GetAdoptionsParams): Promise<ApiResult<Paged<AdminAdoptionRecord>>>
export function getAdminAdoptions(params?: GetAdoptionsParams): Promise<ApiResult<Paged<AdminAdoptionRecord>>> {
  return apiRequest({ method: 'GET', url: '/admin/adoptions', params })
}

export function auditAdoption(id: string, payload: AuditAdoptionPayload): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'POST', url: `/admin/adoptions/${id}/audit`, data: payload })
}

export function scheduleAdoption(id: string, payload: ScheduleAdoptionPayload): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'POST', url: `/admin/adoptions/${id}/schedule`, data: payload })
}
