import { ApiError } from '@/api/adapters/errors'

export function useApiError(error: unknown) {
  if (error instanceof ApiError) {
    return error.message
  }
  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong. Please retry.'
}
