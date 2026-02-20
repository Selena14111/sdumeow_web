import type { UserRole } from './enums'

export type UserProfile = {
  id?: string
  nickname?: string
  avatar?: string
  studentId?: string
  campus?: string
  level?: number
  role?: UserRole
}

export type CatSummary = {
  id: string
  name: string
  avatar?: string
  campus?: string
  location?: string
  color?: string
  status?: string
  tags?: string[]
}

export type SosRecord = {
  id: string
  catId?: string
  catName?: string
  location?: string
  symptoms?: string[]
  status?: string
  createTime?: string
}

export type AdoptionRecord = {
  id: string
  catId?: string
  catName?: string
  status?: string
  createTime?: string
}
