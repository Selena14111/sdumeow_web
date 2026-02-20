import axios, { type AxiosResponse } from 'axios'

import { normalizeApiEnvelope } from './adapters/normalize'
import { toApiError } from './adapters/errors'

import type { ApiResult, ApiRequestConfig } from '@/types/api'
import { DEFAULT_API_BASE_URL } from '@/utils/constants'
import { storage } from '@/utils/storage'

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? DEFAULT_API_BASE_URL,
  timeout: 15_000,
})

httpClient.interceptors.request.use((config) => {
  const token = storage.getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

httpClient.interceptors.response.use(
  (response: AxiosResponse) => {
    response.data = normalizeApiEnvelope(response.data)
    return response
  },
  (error) => Promise.reject(toApiError(error)),
)

export async function apiRequest<TData = unknown, TBody = unknown>(
  config: ApiRequestConfig<TBody>,
): Promise<ApiResult<TData>> {
  const response = await httpClient.request<ApiResult<TData>>(config)
  return response.data
}
