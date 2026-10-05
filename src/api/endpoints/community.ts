import { apiRequest } from '@/api/client'
import type { ApiResult } from '@/types/api'

export type GroupQrcodeData = {
  qrcodeUrl?: string
}

export function getGroupQrcode(): Promise<ApiResult<GroupQrcodeData>> {
  return apiRequest({ method: 'GET', url: '/community/group-qrcode' })
}
