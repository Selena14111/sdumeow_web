import axios, { type AxiosResponse } from 'axios'

import { normalizeApiEnvelope } from './adapters/normalize'
import { toApiError } from './adapters/errors'

import { useAuthStore } from '@/store'
import type { ApiResult, ApiRequestConfig } from '@/types/api'
import { STORAGE_KEYS } from '@/utils/constants'
import { resolveApiBaseUrl } from '@/utils/baseUrls'
import { asRecord, asString } from '@/utils/format'
import { storage } from '@/utils/storage'

type RetriableRequestConfig<TBody = unknown> = ApiRequestConfig<TBody> & {
  _retry?: boolean
  _skipAuthRefresh?: boolean
}

type TokenPair = {
  accessToken?: string
  refreshToken?: string
}

function isRefreshRequest(url?: string): boolean {
  if (!url) return false
  return url === '/users/refresh' || url.endsWith('/users/refresh')
}

export const httpClient = axios.create({
  baseURL: resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL),
  timeout: 15_000,
})

let sessionLoginRedirecting = false

httpClient.interceptors.request.use((config) => {
  const token = storage.getToken()
  const refreshToken = storage.getRefreshToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (refreshToken && isRefreshRequest(config.url)) {
    config.headers['X-Refresh-Token'] = refreshToken
    config.headers['Refresh-Token'] = refreshToken
    config.headers['Meow-Refresh-Token'] = refreshToken
  }
  return config
})

function clearSession() {
  storage.clearToken()
  useAuthStore.getState().logout()
}

function markLoginNotice() {
  try {
    window.sessionStorage.setItem(STORAGE_KEYS.authLoginNotice, '请登录使用功能')
  } catch {
    // Ignore storage failures; the login page can still render normally.
  }
}

function getResponseMessage(error: unknown): string {
  const payload = asRecord(asRecord(error).response ? asRecord(asRecord(error).response).data : undefined)
  return asString(payload.message || payload.msg, '')
}

function shouldPromptRelogin(error: unknown): boolean {
  const response = asRecord(asRecord(error).response)
  const status = response.status
  const message = getResponseMessage(error).toLowerCase()

  return (
    status === 403 &&
    (message.includes('token') ||
      message.includes('过期') ||
      message.includes('expired') ||
      message.includes('登录') ||
      message.includes('认证'))
  )
}

function promptRelogin() {
  if (sessionLoginRedirecting) return

  sessionLoginRedirecting = true
  markLoginNotice()
  clearSession()
  if (window.location.pathname !== '/login') {
    window.location.replace('/login')
  }
}

function pickTokens(payload: unknown): TokenPair {
  const data = asRecord(payload)
  return {
    accessToken: asString(data.accessToken || data.token || data.meowToken),
    refreshToken: asString(data.refreshToken || data.meowRefreshToken),
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const currentRefreshToken = storage.getRefreshToken()
  if (!currentRefreshToken) {
    return null
  }

  const response = await httpClient.request<ApiResult<unknown>>({
    method: 'POST',
    url: '/users/refresh',
    _skipAuthRefresh: true,
  } as RetriableRequestConfig)
  const tokens = pickTokens(response.data.data)
  const nextAccessToken = tokens.accessToken?.trim()
  if (!nextAccessToken) {
    return null
  }

  storage.setTokens({
    token: nextAccessToken,
    refreshToken: tokens.refreshToken?.trim() || currentRefreshToken,
  })

  const authState = useAuthStore.getState()
  if (authState.role) {
    authState.login({
      token: nextAccessToken,
      role: authState.role,
      profile: authState.profile,
    })
  }

  return nextAccessToken
}

httpClient.interceptors.response.use(
  (response: AxiosResponse) => {
    response.data = normalizeApiEnvelope(response.data)
    return response
  },
  async (error) => {
    const originalConfig = error?.config as RetriableRequestConfig | undefined

    if (
      error?.response?.status === 401 &&
      storage.getToken() &&
      originalConfig &&
      !originalConfig._retry &&
      !originalConfig._skipAuthRefresh
    ) {
      originalConfig._retry = true

      try {
        const nextAccessToken = await refreshAccessToken()
        if (nextAccessToken) {
          originalConfig.headers = originalConfig.headers ?? {}
          originalConfig.headers.Authorization = `Bearer ${nextAccessToken}`
          return httpClient.request(originalConfig)
        }
      } catch {
        // Fall through to the normal logout path below.
      }
    }

    if (error?.response?.status === 401 && storage.getToken()) {
      markLoginNotice()
      clearSession()
      if (window.location.pathname !== '/login') {
        window.location.replace('/login')
      }
    }

    if (storage.getToken() && shouldPromptRelogin(error)) {
      promptRelogin()
    }

    return Promise.reject(toApiError(error))
  },
)

export async function apiRequest<TData = unknown, TBody = unknown>(
  config: ApiRequestConfig<TBody>,
): Promise<ApiResult<TData>> {
  const response = await httpClient.request<ApiResult<TData>>(config)
  return response.data
}
