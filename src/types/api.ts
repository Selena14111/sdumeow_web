import type { AxiosRequestConfig } from 'axios'

export type ApiEnvelope<T> = {
  code?: number
  msg?: string
  message?: string
  data?: T
}

export type ApiResult<T> = {
  data: T | null
  code: number | null
  message: string
  raw: unknown
}

export type ApiErrorShape = {
  httpStatus: number | null
  bizCode: number | null
  path: string
  method: string
}

export type Paged<T> = {
  items: T[]
  total: number
  pages: number
  current: number
  size: number
}

export type ApiRequestConfig<TBody = unknown> = AxiosRequestConfig<TBody>
