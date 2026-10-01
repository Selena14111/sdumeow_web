import { asArray, asRecord, asString } from '@/utils/format'

export type DynamicTypeOption = {
  value: number
  label: string
  description?: string
}

export function toDynamicTypeId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value.trim())
    return Number.isInteger(parsed) ? parsed : null
  }
  return null
}

export function normalizeDynamicTypeOptions(payload: unknown): DynamicTypeOption[] {
  const record = asRecord(payload)
  const rawItems = Array.isArray(payload)
    ? payload
    : asArray<unknown>(record.items || record.records || record.list || record.content || record.data)

  if (rawItems.length > 0) {
    return rawItems
      .map((item) => {
        const row = asRecord(item)
        const id = toDynamicTypeId(row.id ?? row.value ?? row.typeId ?? row.key)
        if (id === null) return null

        const label = asString(row.label || row.name || row.tag || row.title || row.content || row.typeName || row.value, String(id))
        const description = asString(row.description || row.desc || row.remark)
        return { value: id, label, ...(description ? { description } : {}) }
      })
      .filter((item): item is DynamicTypeOption => item !== null)
  }

  return Object.entries(record)
    .map(([key, value]) => {
      const valueRecord = asRecord(value)
      const id = toDynamicTypeId(valueRecord.id ?? key)
      if (id === null) return null

      const label = asString(valueRecord.label || valueRecord.name || valueRecord.tag || valueRecord.title || valueRecord.content || valueRecord.typeName || value, String(id))
      const description = asString(valueRecord.description || valueRecord.desc || valueRecord.remark)
      return { value: id, label, ...(description ? { description } : {}) }
    })
    .filter((item): item is DynamicTypeOption => item !== null)
}

export function normalizeDynamicTypeIds(values: unknown): number[] {
  return asArray<unknown>(values)
    .map(toDynamicTypeId)
    .filter((item): item is number => item !== null)
}

export function normalizeDynamicTypeLabel(value: unknown, options: DynamicTypeOption[], fallback = ''): string {
  const directId = toDynamicTypeId(value)
  if (directId !== null) {
    return options.find((option) => option.value === directId)?.label ?? fallback
  }

  const record = asRecord(value)
  const recordId = toDynamicTypeId(record.id ?? record.value ?? record.typeId ?? record.key)
  if (recordId !== null) {
    return options.find((option) => option.value === recordId)?.label ?? fallback
  }

  return asString(record.label || record.name || record.tag || record.title || record.content || record.typeName || value, fallback)
}
