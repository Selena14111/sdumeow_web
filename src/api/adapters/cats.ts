import { asArray, asNumber, asRecord, asString, toPaged } from '@/utils/format'
import { normalizeMediaUrl } from '@/utils/media'

export type NormalizedCat = {
  id: string
  name: string
  avatar: string
  images: string[]
  color: string
  campus: string | number
  location: string
  status: string
  tags: string[]
  popularity: number
  isNeutered: boolean
  raw: Record<string, unknown>
}

const catStatusLabelMap: Record<string, string> = {
  '0': '在校',
  SCHOOL: '在校',
  IN_SCHOOL: '在校',
  CAMPUS: '在校',
  在校: '在校',
  '1': '毕业',
  GRADUATED: '毕业',
  GRADUATE: '毕业',
  毕业: '毕业',
  已毕业: '毕业',
  '2': '喵星',
  MEOW_STAR: '喵星',
  STAR: '喵星',
  DEAD: '喵星',
  喵星: '喵星',
  '3': '住院',
  HOSPITAL: '住院',
  TREAT: '住院',
  TREATING: '住院',
  治疗中: '住院',
  住院: '住院',
  '4': '领养交接中',
  ADOPTION_HANDOVER: '领养交接中',
  HANDOVER: '领养交接中',
  ADOPTING: '领养交接中',
  领养交接中: '领养交接中',
}

function firstPresent(...values: unknown[]): unknown {
  return values.find((value) => {
    if (value === null || value === undefined) return false
    return typeof value !== 'string' || value.trim().length > 0
  })
}

export function normalizeCatStatus(rawStatus: unknown): string {
  if (typeof rawStatus === 'number' && Number.isFinite(rawStatus)) {
    return catStatusLabelMap[String(rawStatus)] ?? '在校'
  }

  const status = asString(rawStatus).trim()
  if (!status) return '在校'

  const upperStatus = status.toUpperCase()
  if (catStatusLabelMap[status]) return catStatusLabelMap[status]
  if (catStatusLabelMap[upperStatus]) return catStatusLabelMap[upperStatus]

  if (upperStatus.includes('HOSPITAL') || upperStatus.includes('TREAT') || status.includes('治疗')) return '住院'
  if (upperStatus.includes('MEOW') || upperStatus.includes('STAR') || status.includes('喵星')) return '喵星'
  if (upperStatus.includes('HANDOVER') || upperStatus.includes('ADOPTING') || status.includes('交接')) return '领养交接中'
  if (upperStatus.includes('GRADUATE') || status.includes('毕业')) return '毕业'
  if (upperStatus.includes('SCHOOL') || upperStatus.includes('CAMPUS') || status.includes('在校')) return '在校'

  return status
}

export function normalizeCat(item: unknown, index = 0): NormalizedCat {
  const row = asRecord(item)
  const basicInfo = asRecord(row.basicInfo)
  const neutered = asRecord(basicInfo.neutered || row.neutered)
  const images = asArray<string>(row.images || row.imageURLs || row.media || row.medium)
  const id = asString(row.id || row.catId || row.cid || row.uuid || row.key, String(index + 1))
  const name = asString(row.name || row.catName || row.nickname || row.officialName || row.tempName, `猫咪${index + 1}`)

  return {
    id,
    name,
    avatar: normalizeMediaUrl(row.avatar || row.cover || row.image || images[0]),
    images: images.map(normalizeMediaUrl).filter(Boolean),
    color: asString(row.color || basicInfo.color, '未知花色'),
    campus: (row.campus ?? basicInfo.campus ?? row.campusCode ?? '') as string | number,
    location: asString(row.locationName || row.location || row.hauntLocation || basicInfo.hauntLocation, '未知地点'),
    status: normalizeCatStatus(firstPresent(row.status, row.statusText, basicInfo.status)),
    tags: asArray<string>(row.tags || row.tagNames).filter(Boolean),
    popularity: asNumber(row.popularity, asNumber(row.score, asNumber(row.likeCount))),
    isNeutered: row.isNeutered === true || row.neutered === true || neutered.isNeutered === true,
    raw: row,
  }
}

export function normalizeCats(payload: unknown): NormalizedCat[] {
  const rawItems = Array.isArray(payload) ? payload : toPaged<Record<string, unknown>>(payload).items
  return rawItems.map((item, index) => normalizeCat(item, index)).filter((item) => item.id)
}
