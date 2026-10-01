import { apiRequest } from '@/api/client'
import { normalizeCat, normalizeCats } from '@/api/adapters/cats'
import type { ApiResult } from '@/types/api'
import type { CatDetail, CatListResult } from '@/types/domain'
import { asArray, asNumber, asRecord, toPaged } from '@/utils/format'
import { normalizeMediaUrl } from '@/utils/media'

export type GetCatsParams = {
  page?: number
  pageSize?: number
  campus?: number | string
  status?: number | string
  color?: number | string
  search?: string
  sort?: string
}

export type CreateNewCatPayload = {
  tempName?: string
  color: number
  images: string[]
  campus: number
  location: number
  tags?: number[]
  attributes?: {
    friendliness: number
    gluttony: number
    fight: number
    appearance: number
  }
  attributeScore?: {
    friendliness: number
    gluttony: number
    fight: number
    appearance: number
  }
}

function firstPresent(...values: unknown[]): unknown {
  return values.find((value) => {
    if (value === null || value === undefined) return false
    return typeof value !== 'string' || value.trim().length > 0
  })
}

function toNumericScore(value: unknown): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

export async function getCats(params?: GetCatsParams): Promise<ApiResult<CatListResult>> {
  const result = await apiRequest<Record<string, unknown>>({ method: 'GET', url: '/cats', params })
  const paged = toPaged<Record<string, unknown>>(result.data)
  return {
    ...result,
    data: {
      ...paged,
      items: normalizeCats(result.data),
    },
  } as ApiResult<CatListResult>
}

export async function getCatDetail(catId: string): Promise<ApiResult<CatDetail>> {
  const result = await apiRequest<Record<string, unknown>>({ method: 'GET', url: `/cats/${catId}` })
  const cat = normalizeCat(result.data)
  const row = asRecord(result.data)
  const basicInfo = asRecord(row.basicInfo)
  const attributes = asRecord(row.attributes || row.attributeScore)
  const neutered = asRecord(basicInfo.neutered || row.neutered)
  const rawImages = asArray<string>(row.images || row.imageURLs || row.media || row.medium)
  const images = Array.from(new Set([cat.avatar, ...rawImages.map(normalizeMediaUrl), ...cat.images].filter(Boolean)))

  return {
    ...result,
    data: {
      id: cat.id,
      name: cat.name,
      aliases: Array.isArray(row.aliases) ? row.aliases as string[] : [],
      avatar: cat.avatar,
      images,
      basicInfo: {
        color: cat.color,
        colorId: firstPresent(row.colorId, basicInfo.colorId, row.color, basicInfo.color, cat.color) as string | number | undefined,
        gender: firstPresent(row.gender, basicInfo.gender) as string | number | undefined,
        campus: firstPresent(row.campus, basicInfo.campus, row.campusCode, cat.campus) as string | number | undefined,
        hauntLocation: firstPresent(row.hauntLocation, basicInfo.hauntLocation, row.location, row.locationName, cat.location) as string | number | undefined,
        role: firstPresent(row.roleName, basicInfo.roleName, row.role, basicInfo.role) as string | number | undefined,
        birthYear: asNumber(row.birthYear || basicInfo.birthYear),
        admissionDate: String(row.admissionDate || basicInfo.admissionDate || ''),
        status: cat.status,
        healthStatus: firstPresent(row.healthStatus, basicInfo.healthStatus) as string | number | undefined,
        lastSeenTime: String(row.lastSeenTime || basicInfo.lastSeenTime || ''),
        neutered: {
          isNeutered: cat.isNeutered,
          neuteredDate: String(row.neuteredDate || neutered.neuteredDate || neutered.date || ''),
          type: firstPresent(row.neuteredType, neutered.type) as string | number | undefined,
        },
      },
      attributes: {
        friendliness: toNumericScore(attributes.friendliness),
        gluttony: toNumericScore(attributes.gluttony),
        fight: toNumericScore(attributes.fight),
        appearance: toNumericScore(attributes.appearance),
      },
      tags: Array.isArray(row.tagIds) ? row.tagIds as number[] : Array.isArray(row.tags) ? row.tags as Array<string | number> : cat.tags,
      relationship: [],
      description: String(row.description || row.remark || row.note || ''),
      popularity: cat.popularity,
    },
  } as ApiResult<CatDetail>
}

export function feedCat(catId: string): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'POST', url: `/cats/${catId}/feed` })
}

export function followCat(catId: string): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'POST', url: `/cats/${catId}/follow` })
}

export function unfollowCat(catId: string): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'DELETE', url: `/cats/${catId}/follow` })
}

export function createNewCat(payload: CreateNewCatPayload): Promise<ApiResult<Record<string, unknown>>> {
  return apiRequest({ method: 'POST', url: '/new-cats', data: payload })
}
