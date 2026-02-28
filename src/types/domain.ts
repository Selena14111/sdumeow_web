import type { UserRole } from './enums'

export type UserProfile = {
  id?: string
  nickname?: string
  avatar?: string
  studentId?: string
  campus?: string
  level?: number
  currency?: number
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

export type CatListItem = {
  id: string
  name: string
  avatar?: string
  color?: string
  campus?: string
  locationName?: string
  status?: string
  tags?: string[]
  isNeutered?: boolean
  popularity?: number
  lastSeenTime?: string
  roleName?: string
}

export type CatListResult = {
  total?: number
  items?: CatListItem[]
}

export type CatNeuteredInfo = {
  isNeutered?: boolean
  neuteredDate?: string
  type?: string
}

export type CatBasicInfo = {
  color?: string
  gender?: string
  campus?: string
  hauntLocation?: string
  role?: string
  birthYear?: number
  admissionDate?: string
  status?: string
  healthStatus?: string
  lastSeenTime?: string
  furLength?: string
  neutered?: CatNeuteredInfo
}

export type CatAttributes = {
  friendliness?: number
  gluttony?: number
  fight?: number
  appearance?: number
}

export type CatRelationship = {
  catId?: string
  name?: string
  relation?: string
  avatar?: string
}

export type CatInteraction = {
  isFollowed?: boolean
}

export type CatDetail = {
  id: string
  name: string
  aliases?: string[]
  avatar?: string
  images?: string[]
  basicInfo?: CatBasicInfo
  attributes?: CatAttributes
  tags?: string[]
  relationship?: CatRelationship[]
  description?: string
  interaction?: CatInteraction
  popularity?: number
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

export type AdoptionContact = {
  phone?: string
  wechat?: string
}

export type AdoptionInfo = {
  housing?: string
  experience?: string
  plan?: string
}

export type AdoptionRecord = {
  id: string
  catId?: string
  catName?: string
  catAvatar?: string
  status?: string
  createTime?: string
  reason?: string
  contact?: AdoptionContact
  info?: AdoptionInfo
}

export type AdminAdoptionRecord = AdoptionRecord & {
  userId?: number
  userName?: string
}
