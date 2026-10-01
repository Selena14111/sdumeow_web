import {
  normalizeDynamicTypeLabel,
  normalizeDynamicTypeOptions,
  toDynamicTypeId,
  type DynamicTypeOption,
} from '@/api/adapters/types'
import { asRecord, asString } from '@/utils/format'

export const fallbackAnnouncementTypeOptions: DynamicTypeOption[] = [
  { value: 0, label: '健康知识' },
  { value: 1, label: '喂养指南' },
  { value: 2, label: '行为解读' },
  { value: 3, label: '校园资讯' },
]

function mergeAnnouncementTypeOptions(options: DynamicTypeOption[] = []): DynamicTypeOption[] {
  const optionMap = new Map(fallbackAnnouncementTypeOptions.map((option) => [option.value, option]))

  options.forEach((option) => {
    optionMap.set(option.value, option)
  })

  return Array.from(optionMap.values()).sort((left, right) => left.value - right.value)
}

function getDynamicTypeId(value: unknown): number | null {
  const directId = toDynamicTypeId(value)
  if (directId !== null) return directId

  const record = asRecord(value)
  return toDynamicTypeId(record.id ?? record.value ?? record.typeId ?? record.key)
}

function inferAnnouncementTypeId(value: unknown): number | null {
  const dynamicId = getDynamicTypeId(value)
  if (dynamicId !== null) return dynamicId

  const record = asRecord(value)
  const text = asString(record.label || record.name || record.typeName || value).trim()
  if (!text) return null

  const upper = text.toUpperCase()
  if (upper.includes('HEALTH') || text.includes('健康')) return 0
  if (upper.includes('FEED') || text.includes('喂养')) return 1
  if (upper.includes('BEHAVIOR') || text.includes('行为')) return 2
  if (upper.includes('CAMPUS') || upper.includes('NEWS') || text.includes('校园') || text.includes('资讯')) return 3

  return null
}

export function getAnnouncementTypeOptions(payload: unknown): DynamicTypeOption[] {
  return mergeAnnouncementTypeOptions(normalizeDynamicTypeOptions(payload))
}

export function normalizeAnnouncementTypeId(value: unknown, fallback = 3): number {
  return inferAnnouncementTypeId(value) ?? fallback
}

export function getAnnouncementTypeLabel(value: unknown, options: DynamicTypeOption[] = fallbackAnnouncementTypeOptions): string {
  const mergedOptions = mergeAnnouncementTypeOptions(options)
  const typeId = inferAnnouncementTypeId(value)

  if (typeId !== null) {
    return normalizeDynamicTypeLabel(typeId, mergedOptions, String(typeId))
  }

  const record = asRecord(value)
  const recordLabel = asString(record.label || record.name || record.typeName).trim()
  if (recordLabel) return recordLabel

  const rawText = asString(value).trim()
  return rawText && !/^[A-Z_]+$/.test(rawText) ? rawText : normalizeDynamicTypeLabel(3, mergedOptions, '校园资讯')
}
