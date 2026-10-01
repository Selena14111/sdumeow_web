import type { AxiosError } from 'axios'

import type { ApiErrorShape } from '@/types/api'

export class ApiError extends Error {
  shape: ApiErrorShape

  constructor(message: string, shape: ApiErrorShape) {
    super(message)
    this.name = 'ApiError'
    this.shape = shape
  }
}

export class ApiNotFoundError extends ApiError {
  constructor(shape: ApiErrorShape) {
    super('Endpoint is not available in current mock environment.', shape)
    this.name = 'ApiNotFoundError'
  }
}

export function toApiError(error: unknown): ApiError {
  const axiosError = error as AxiosError<{ code?: number; msg?: string; message?: string }>
  const status = axiosError.response?.status ?? null
  const payload = axiosError.response?.data

  const message =
    payload?.message ||
    payload?.msg ||
    axiosError.message ||
    'Network request failed. Please retry.'

  const shape: ApiErrorShape = {
    httpStatus: status,
    bizCode: payload?.code ?? null,
    path: axiosError.config?.url ?? 'unknown',
    method: (axiosError.config?.method ?? 'GET').toUpperCase(),
  }

  if (status === 404) {
    return new ApiNotFoundError(shape)
  }

  return new ApiError(message, shape)
}
