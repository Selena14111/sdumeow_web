import { apiRequest } from '@/api/client'
import type { ApiResult } from '@/types/api'
import { resolveApiBaseUrl } from '@/utils/baseUrls'
import { asRecord, asString } from '@/utils/format'

export type AuthLoginPayload = {
  email: string
  password: string
}

export type AuthRegisterPayload = {
  email: string
  password: string
  code: string
}

export type SendVerificationCodePayload = {
  email: string
}

export type ChangePasswordPayload = {
  oldPassword: string
  newPassword: string
  confirmPassword: string
}

export type ForgotPasswordPayload = {
  email: string
  code: string
  newPassword: string
  confirmPassword: string
}

export type AuthLoginData = {
  accessToken?: string
  refreshToken?: string
  email?: string
}

export type AuthRedirectParams = {
  platform?: string
}

export function buildAuthLoginUrl(params: AuthRedirectParams = {}): string {
  const url = new URL(`${resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL)}/auth/login`)
  if (params.platform) {
    url.searchParams.set('platform', params.platform)
  }
  return url.toString()
}

export function buildAuthAdminLoginUrl(params: AuthRedirectParams = {}): string {
  const url = new URL(`${resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL)}/auth/admin-login`)
  if (params.platform) {
    url.searchParams.set('platform', params.platform)
  }
  return url.toString()
}

export function getAuthTokens(data: unknown): { accessToken: string; refreshToken: string } {
  const record = asRecord(data)
  return {
    accessToken: asString(record.accessToken || record.token || record.meowToken).trim(),
    refreshToken: asString(record.refreshToken || record.meowRefreshToken).trim(),
  }
}

export function login(payload: AuthLoginPayload): Promise<ApiResult<AuthLoginData>> {
  return apiRequest({
    method: 'POST',
    url: '/users/login',
    data: payload,
  })
}

export function adminLogin(payload: AuthLoginPayload): Promise<ApiResult<AuthLoginData>> {
  return apiRequest({
    method: 'POST',
    url: '/admin/login',
    data: payload,
  })
}

export function register(payload: AuthRegisterPayload): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({
    method: 'POST',
    url: '/users/register',
    data: payload,
  })
}

export function sendVerificationCode(payload: SendVerificationCodePayload): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({
    method: 'POST',
    url: '/users/send-verification-code',
    data: payload,
  })
}

export function changePassword(payload: ChangePasswordPayload): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({
    method: 'POST',
    url: '/users/change-password',
    data: payload,
  })
}

export function forgotPassword(payload: ForgotPasswordPayload): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({
    method: 'POST',
    url: '/users/change-password',
    data: payload,
  })
}
