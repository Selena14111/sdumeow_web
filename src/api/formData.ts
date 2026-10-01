function isBlobLike(value: unknown): value is Blob {
  return typeof Blob !== 'undefined' && value instanceof Blob
}

function appendToFormData(formData: FormData, key: string, value: unknown): void {
  if (value === null || value === undefined) return

  if (value instanceof Date) {
    formData.append(key, value.toISOString())
    return
  }

  if (isBlobLike(value)) {
    formData.append(key, value)
    return
  }

  if (Array.isArray(value)) {
    value.forEach((item) => appendToFormData(formData, key, item))
    return
  }

  if (typeof value === 'object') {
    Object.entries(value as Record<string, unknown>).forEach(([childKey, childValue]) => {
      appendToFormData(formData, `${key}[${childKey}]`, childValue)
    })
    return
  }

  formData.append(key, String(value))
}

export function buildFormData(payload: Record<string, unknown>): FormData {
  const formData = new FormData()
  Object.entries(payload).forEach(([key, value]) => appendToFormData(formData, key, value))
  return formData
}

export function hasBinary(value: unknown): boolean {
  if (value === null || value === undefined) return false
  if (isBlobLike(value)) return true
  if (value instanceof Date) return false
  if (Array.isArray(value)) return value.some((item) => hasBinary(item))
  if (typeof value === 'object') {
    return Object.values(value as Record<string, unknown>).some((item) => hasBinary(item))
  }
  return false
}
