import { apiRequest } from '@/api/client'
import type { ApiResult } from '@/types/api'

type LoginPayload = {
  account: string
  password: string
}

export function login(payload: LoginPayload): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({
    method: 'POST',
    url: '/users/login',
    data: payload,
  })
}

export function register(payload: LoginPayload): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({
    method: 'POST',
    url: '/users/register',
    data: payload,
  })
}
