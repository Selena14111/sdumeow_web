export const UserRole = {
  User: 'user',
  Admin: 'admin',
  Guest: 'guest',
} as const

export type UserRole = (typeof UserRole)[keyof typeof UserRole]

export const RequestStatus = {
  Idle: 'idle',
  Loading: 'loading',
  Success: 'success',
  Error: 'error',
} as const

export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus]
