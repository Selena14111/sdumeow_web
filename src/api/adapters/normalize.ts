import type { ApiEnvelope, ApiResult } from '@/types/api'
import { asRecord } from '@/utils/format'

export function normalizeApiEnvelope<T>(payload: unknown): ApiResult<T> {
  const envelope = asRecord(payload) as ApiEnvelope<T>

  return {
    data: envelope.data ?? null,
    code: typeof envelope.code === 'number' ? envelope.code : null,
    message:
      typeof envelope.msg === 'string'
        ? envelope.msg
        : typeof envelope.message === 'string'
          ? envelope.message
          : '',
    raw: payload,
  }
}
