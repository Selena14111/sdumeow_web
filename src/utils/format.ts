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

export function formatTimestampText(value: unknown, fallback = ''): string {
  return asString(value, fallback).replace(/T/g, ' ')
}

export function asNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export function toPaged<T>(value: unknown): Paged<T> {
  const record = asRecord(value)
  const rawItems = Array.isArray(value)
    ? value
    : record.items || record.records || record.list || record.content || record.data || []
  return {
    items: asArray<T>(rawItems),
    total: asNumber(record.total, asNumber(record.totalElements, asArray<T>(rawItems).length)),
    pages: asNumber(record.pages, asNumber(record.totalPages)),
    current: asNumber(record.current, asNumber(record.page, asNumber(record.number))),
    size: asNumber(record.size, asNumber(record.pageSize)),
  }
}
