import type { Paged } from '@/types/api'

export function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}
}

export function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : []
}

export function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

export function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export function toPaged<T>(value: unknown): Paged<T> {
  const record = asRecord(value)
  return {
    items: asArray<T>(record.items),
    total: asNumber(record.total),
    pages: asNumber(record.pages),
    current: asNumber(record.current),
    size: asNumber(record.size),
  }
}
