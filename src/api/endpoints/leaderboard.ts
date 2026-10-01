import { apiRequest } from '@/api/client'
import type { ApiResult } from '@/types/api'

export function getLeaderboard(type: string): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'GET', url: `/leaderboard/${type}` })
}
