export function stripQueryContext<TParams extends object>(params: TParams | unknown): TParams | undefined {
  if (typeof params === 'object' && params !== null) {
    const record = params as Record<string, unknown>
    if (Array.isArray(record.queryKey) && 'signal' in record) {
      return undefined
    }
  }

  return params as TParams | undefined
}
