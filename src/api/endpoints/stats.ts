import { apiRequest } from '@/api/client'
import type { ApiResult } from '@/types/api'

export type StatementParams = {
  page?: number
  pageSize?: number
}

export type StatLogParams = StatementParams & {
  statType?: 'EXP' | 'TOTAL_CHECK_IN_DAYS' | 'FEED_COUNT' | 'CATS_FOUND' | 'RECEIVED_LIKES' | 'MOMENT_COUNT' | string
}

export type AssetLogParams = StatementParams & {
  assetType?: 'CURRENCY' | string
}

export function getPublicStats(): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/stats/public' })
}

export function getFeedLogs(params?: StatementParams): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/statement/feed-log', params })
}

export function getStatLogs(params?: StatLogParams): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/statement/stat-log', params })
}

export function getAssetLogs(params?: AssetLogParams): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: '/statement/asset-log', params })
}
