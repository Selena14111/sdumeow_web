import { ArrowLeftOutlined, CameraOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Form, Input, Modal, Select, message } from 'antd'
import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { ApiError, ApiNotFoundError } from '@/api/adapters/errors'
import { normalizeDynamicTypeIds, normalizeDynamicTypeOptions, toDynamicTypeId, type DynamicTypeOption } from '@/api/adapters/types'
import { deleteAdminCat, getAdminCatImageKeys, upsertAdminCat } from '@/api/endpoints/admin'
import { getCatDetail } from '@/api/endpoints/cats'
import { uploadImages } from '@/api/endpoints/cos'
import { getColors, getLocations, getRoles, getTags } from '@/api/endpoints/types'
import { ApiUnavailable } from '@/components/feedback/ApiUnavailable'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asArray, asRecord, asString } from '@/utils/format'
import { normalizeMediaUrl } from '@/utils/media'

type CatEditForm = {
  name: string
  color: number | string
  gender: string
  campus: string
  location?: number | string
  role?: number | string
  status: string
  neuteredType: string
  neuteredDate: string
  description: string
  tags: Array<number | string>
  friendlinessScore: number
  gluttonyScore: number
  fightScore: number
  appearanceScore: number
}

const statusOptions = [
  { value: 'SCHOOL', label: '在校', icon: '🏫', activeClass: 'bg-[#22c55e] border-[#16a34a] text-white shadow-[0_8px_18px_rgba(34,197,94,0.35)]' },
  { value: 'GRADUATED', label: '毕业', icon: '🎓', activeClass: 'bg-[#3b82f6] border-[#2563eb] text-white shadow-[0_8px_18px_rgba(59,130,246,0.35)]' },
  { value: 'MEOW_STAR', label: '喵星', icon: '⭐', activeClass: 'bg-[#fff8e1] border-[#ffd54f] text-[#ffa000]' },
  { value: 'HOSPITAL', label: '住院', icon: '🏥', activeClass: 'bg-[#ffebee] border-[#ff5252] text-[#d32f2f]' },
  { value: 'ADOPTION_HANDOVER', label: '领养交接中', icon: '交', activeClass: 'bg-[#fdf2f8] border-[#f9a8d4] text-[#be185d]' },
]

const defaultResidenceLocation = '食堂'
const fallbackAvatarUrl = 'https://image.foofish.work/i/2026/02/25/699eecdb6731f-1772023003.png'

const campusCodeToLabelMap: Record<string, string> = {
  '0': '中心校区',
  '1': '趵突泉校区',
  '2': '洪家楼校区',
  '3': '千佛山校区',
  '4': '兴隆山校区',
  '5': '软件园校区',
  '6': '青岛校区',
  '7': '威海校区',
}

const campusLabelToCodeMap: Record<string, string> = {
  中心校区: '0',
  趵突泉校区: '1',
  洪家楼校区: '2',
  千佛山校区: '3',
  兴隆山校区: '4',
  软件园校区: '5',
  青岛校区: '6',
  威海校区: '7',
}

const campusCodeToEnumMap: Record<string, string> = {
  '0': 'CENTRAL',
  '1': 'BAOTUQUAN',
  '2': 'HONGJIALOU',
  '3': 'QIANFOSHAN',
  '4': 'XINGLONGSHAN',
  '5': 'SOFTWARE_PARK',
  '6': 'QINGDAO',
  '7': 'WEIHAI',
}

const campusOptions = Object.keys(campusCodeToLabelMap).map((code) => ({
  label: campusCodeToLabelMap[code],
  value: code,
}))

type EditableCat = CatEditForm & {
  avatar: string
  neuteredTypeRaw: string
}

const defaultCat: EditableCat = {
  name: '麻薯',
  color: '',
  gender: 'FEMALE',
  campus: '5',
  location: defaultResidenceLocation,
  role: 1,
  status: 'SCHOOL',
  neuteredType: 'EAR_CUT',
  neuteredDate: '2023-11-13',
  description: '麻薯非常亲人，喜欢吃罐头。进食时不喜欢被摸头，偶尔会哈气。',
  tags: [],
  friendlinessScore: 90,
  gluttonyScore: 95,
  fightScore: 40,
  appearanceScore: 100,
  avatar: fallbackAvatarUrl,
  neuteredTypeRaw: 'EAR_CUT',
}

function firstPresent(...values: unknown[]): unknown {
  return values.find((value) => {
    if (value === null || value === undefined) return false
    return typeof value !== 'string' || value.trim().length > 0
  })
}

function toIntegerId(rawValue: unknown): number | null {
  if (typeof rawValue === 'number' && Number.isInteger(rawValue)) return rawValue
  if (typeof rawValue !== 'string') return null

  const value = rawValue.trim()
  if (!/^\d+$/.test(value)) return null

  return Number(value)
}

function resolveGender(rawGender: unknown): string {
  const genderId = toIntegerId(rawGender)
  if (genderId === 1) return 'MALE'
  if (genderId === 2) return 'FEMALE'
  if (genderId === 0) return 'UNKNOWN'

  const gender = asString(rawGender).trim().toUpperCase()
  if (gender.includes('MALE') && !gender.includes('FEMALE')) return 'MALE'
  if (gender.includes('FEMALE')) return 'FEMALE'
  if (gender.includes('公')) return 'MALE'
  if (gender.includes('母')) return 'FEMALE'
  return 'UNKNOWN'
}

function toGenderCode(rawGender: unknown): number {
  const genderId = toIntegerId(rawGender)
  if (genderId !== null) return genderId

  const gender = resolveGender(rawGender)
  if (gender === 'MALE') return 1
  if (gender === 'FEMALE') return 2
  return 0
}

function resolveCatStatus(rawStatus: unknown): string {
  const statusId = toIntegerId(rawStatus)
  if (statusId === 0) return 'SCHOOL'
  if (statusId === 1) return 'GRADUATED'
  if (statusId === 2) return 'MEOW_STAR'
  if (statusId === 3) return 'HOSPITAL'
  if (statusId === 4) return 'ADOPTION_HANDOVER'

  const status = asString(rawStatus).trim().toUpperCase()
  if (status.includes('HOSPITAL') || status.includes('TREAT')) return 'HOSPITAL'
  if (status.includes('MEOW') || status.includes('STAR')) return 'MEOW_STAR'
  if (status.includes('GRADUATE') || status.includes('ADOPTED')) return 'GRADUATED'
  if (status.includes('HANDOVER') || status.includes('ADOPTING') || status.includes('PENDING')) return 'ADOPTION_HANDOVER'
  if (status.includes('领养交接')) return 'ADOPTION_HANDOVER'
  return 'SCHOOL'
}

function toCatStatusCode(rawStatus: unknown): number {
  const statusId = toIntegerId(rawStatus)
  if (statusId !== null) return statusId

  const status = resolveCatStatus(rawStatus)
  if (status === 'GRADUATED') return 1
  if (status === 'MEOW_STAR') return 2
  if (status === 'HOSPITAL') return 3
  if (status === 'ADOPTION_HANDOVER') return 4
  return 0
}

function resolveNeuteredType(rawType: unknown): string {
  const typeId = toIntegerId(rawType)
  if (typeId === 0) return 'EAR_CUT'
  if (typeId === 1) return 'NORMAL'
  if (typeId === 2) return 'NONE'

  const value = asString(rawType).trim().toUpperCase()
  if (
    value.includes('NORMAL') ||
    value.includes('UNCUT') ||
    value.includes('NO_CUT') ||
    value.includes('NO CUT') ||
    value.includes('NOT_CUT') ||
    value.includes('NOT CUT') ||
    value.includes('未剪耳') ||
    value.includes('无耳标')
  ) {
    return 'NORMAL'
  }
  if (value.includes('EAR')) return 'EAR_CUT'
  if (value.includes('CUT') || value.includes('剪耳') || value.includes('耳尖')) return 'EAR_CUT'
  if (value.includes('NONE') || value.includes('NO') || value.includes('NOT') || value.includes('UNNEUTERED') || value.includes('未绝育')) return 'NONE'
  return 'NORMAL'
}

function toNeuteredTypeCode(rawType: unknown): number {
  const neuteredType = resolveNeuteredType(rawType)
  return neuteredType === 'EAR_CUT' ? 0 : 1
}

function toOptionalBoolean(rawValue: unknown): boolean | null {
  if (typeof rawValue === 'boolean') return rawValue
  if (typeof rawValue === 'number' && Number.isFinite(rawValue)) return rawValue !== 0
  if (typeof rawValue !== 'string') return null

  const value = rawValue.trim().toLowerCase()
  if (!value) return null
  if (['true', '1', 'yes', 'y', '已绝育'].includes(value)) return true
  if (['false', '0', 'no', 'n', '未绝育'].includes(value)) return false
  return null
}

function toEditableCat(item: unknown): EditableCat | null {
  const row = asRecord(item)
  if (!Object.keys(row).length) return null

  const basicInfo = asRecord(row.basicInfo)
  const attributes = asRecord(row.attributes || row.attributeScore)
  const neutered = asRecord(basicInfo.neutered || row.neutered)
  const rawNeuteredTypeValue = firstPresent(neutered.type, row.neuteredType)
  const rawNeuteredType = rawNeuteredTypeValue === undefined ? '' : String(rawNeuteredTypeValue)
  const rawIsNeutered = toOptionalBoolean(firstPresent(neutered.isNeutered, row.isNeutered))
  const resolvedNeuteredType = rawIsNeutered === false ? 'NONE' : resolveNeuteredType(rawNeuteredTypeValue)
  const normalizeScoreToHundred = (rawScore: unknown, fallback: number) => {
    const value = Number(rawScore)
    if (!Number.isFinite(value)) return fallback
    if (value <= 1) return Math.round(value * 100)
    if (value <= 10) return Math.round(value * 10)
    return Math.max(0, Math.min(100, Math.round(value)))
  }

  return {
    name: asString(row.name, defaultCat.name),
    color: (basicInfo.colorId ?? row.colorId ?? basicInfo.color ?? row.color ?? defaultCat.color) as number | string,
    gender: resolveGender(firstPresent(basicInfo.gender, row.gender) ?? defaultCat.gender),
    campus: normalizeCampusCode(basicInfo.campus || row.campus || row.campusCode),
    location: (firstPresent(row.hauntLocation, basicInfo.hauntLocation, row.location, row.locationName) ?? defaultCat.location) as number | string,
    role: (firstPresent(row.role, row.roleId, row.roleName, basicInfo.role, basicInfo.roleId, basicInfo.roleName) ?? defaultCat.role) as number | string,
    status: resolveCatStatus(firstPresent(basicInfo.status, row.status, row.statusText)),
    neuteredType: resolvedNeuteredType,
    neuteredDate: asString(neutered.neuteredDate || neutered.date || row.neuteredDate, defaultCat.neuteredDate),
    description: asString(row.description || basicInfo.description || row.remark || row.note, ''),
    tags: asArray<number | string>(row.tagIds || row.tags || row.tagNames),
    friendlinessScore: normalizeScoreToHundred(
      attributes.friendliness || row.affinityScore || row.friendliness,
      defaultCat.friendlinessScore,
    ),
    gluttonyScore: normalizeScoreToHundred(attributes.gluttony || row.healthScore || row.gluttony, defaultCat.gluttonyScore),
    fightScore: normalizeScoreToHundred(attributes.fight || row.fightScore || row.fight, defaultCat.fightScore),
    appearanceScore: normalizeScoreToHundred(attributes.appearance || row.appearanceScore || row.appearance, defaultCat.appearanceScore),
    avatar: normalizeMediaUrl(row.avatar || asArray<string>(row.images)[0] || row.image),
    neuteredTypeRaw: rawNeuteredType || defaultCat.neuteredTypeRaw,
  }
}

function normalizeCampusCode(rawCampus: unknown): string {
  if (typeof rawCampus === 'number' && Number.isFinite(rawCampus)) {
    const code = String(rawCampus)
    if (code in campusCodeToLabelMap) return code
  }

  if (typeof rawCampus === 'string') {
    const campus = rawCampus.trim()
    if (!campus) return '5'
    if (campus in campusCodeToLabelMap) return campus
    if (campus in campusLabelToCodeMap) return campusLabelToCodeMap[campus]

    const enumCode = Object.entries(campusCodeToEnumMap).find(([, enumValue]) => enumValue === campus)?.[0]
    if (enumCode) return enumCode
  }

  return '5'
}

function toTenScale(rawScore: number): number {
  return Number((Math.min(100, Math.max(0, rawScore)) / 10).toFixed(1))
}

function toHundredScoreOrDefault(rawScore: unknown, fallback: number): number {
  const value = Number(rawScore)
  if (!Number.isFinite(value)) return fallback
  return value
}

function normalizeAvatarForSubmit(rawAvatar: string): string {
  const avatar = rawAvatar.trim()
  if (!avatar) return fallbackAvatarUrl
  return avatar
}

function stripImageKey(rawKey: string): string {
  return rawKey.trim().replace(/[?#].*$/, '').replace(/^\/+/, '')
}

function normalizeImageKey(rawUrl: unknown): string {
  if (typeof rawUrl !== 'string') return ''
  const value = rawUrl.trim()
  if (!value || /^data:|^blob:/i.test(value)) return ''

  if (/^https?:\/\//i.test(value) || value.startsWith('//')) {
    try {
      const url = new URL(value.startsWith('//') ? `https:${value}` : value)
      const queryKey = url.searchParams.get('key') || url.searchParams.get('fileKey') || url.searchParams.get('objectKey')
      if (queryKey) return stripImageKey(decodeURIComponent(queryKey))

      const pathKey = stripImageKey(decodeURIComponent(url.pathname))
      const isCosUrl = url.hostname.includes('cos.') || url.hostname.includes('myqcloud.com')
      const looksLikeCosKey = /^(meow|cat|cats|image|images|avatar|avatars)\//i.test(pathKey)
      return isCosUrl || looksLikeCosKey ? pathKey : ''
    } catch {
      return ''
    }
  }

  return stripImageKey(value)
}

function pickImageKeyFromRecord(record: Record<string, unknown>): string {
  const directCandidates = [
    record.avatarKey,
    record.coverKey,
    record.imageKey,
    record.key,
    record.objectKey,
    record.fileKey,
    record.cosKey,
    record.path,
    record.avatar,
    record.avatarUrl,
    record.cover,
    record.coverUrl,
    record.image,
    record.imageUrl,
    record.url,
  ]
  for (const candidate of directCandidates) {
    const directKey = normalizeImageKey(candidate)
    if (directKey) return directKey
  }

  const nestedSources = [record.avatar, record.cover, record.image, record.file, record.data]
  for (const nestedSource of nestedSources) {
    const nestedRecord = asRecord(nestedSource)
    if (!Object.keys(nestedRecord).length) continue

    const nestedKey = pickImageKeyFromRecord(nestedRecord)
    if (nestedKey) return nestedKey
  }

  return ''
}

function collectImageKeys(payload: unknown): string[] {
  const root = asRecord(payload)
  const directKey = pickImageKeyFromRecord(root)
  const collections = [
    payload,
    root.avatarKeys,
    root.imageKeys,
    root.keys,
    root.images,
    root.items,
    root.files,
    root.list,
    root.records,
    root.data,
  ]
  const keys = directKey ? [directKey] : []

  collections.forEach((collection) => {
    asArray<unknown>(collection).forEach((item) => {
      const itemKey = typeof item === 'string' ? normalizeImageKey(item) : pickImageKeyFromRecord(asRecord(item))
      if (itemKey) keys.push(itemKey)
    })
  })

  return Array.from(new Set(keys))
}

function pickAvatarKey(payload: unknown, currentAvatar: string): string {
  const currentKey = normalizeImageKey(currentAvatar)
  const keys = collectImageKeys(payload)
  if (!keys.length) return currentKey
  if (!currentKey) return keys[0]

  return keys.find((key) => key === currentKey || key.endsWith(currentKey) || currentKey.endsWith(key)) ?? keys[0]
}

async function resolveAvatarForSubmit(avatarFile: File | null, rawAvatar: string, catId?: string): Promise<string> {
  if (avatarFile) {
    const uploadedAvatar = (await uploadImages([avatarFile]))[0]
    if (!uploadedAvatar) {
      throw new Error('头像上传失败，请重试')
    }
    return uploadedAvatar
  }

  if (catId) {
    try {
      const imageKeysResult = await getAdminCatImageKeys(catId)
      const avatarKey = pickAvatarKey(imageKeysResult.data, rawAvatar)
      if (avatarKey) return avatarKey
    } catch (error) {
      const avatarKey = normalizeImageKey(rawAvatar)
      if (avatarKey) return avatarKey
      throw error
    }

    throw new Error('头像 key 获取失败，请重新选择头像后保存')
  }

  return normalizeAvatarForSubmit(rawAvatar)
}

function normalizeDateToYmd(rawDate: unknown): string {
  if (typeof rawDate !== 'string') return ''
  const value = rawDate.trim()
  if (!value) return ''
  const match = value.match(/\d{4}-\d{2}-\d{2}/)
  return match ? match[0] : ''
}

type AttributeFieldName = 'attributes' | 'attributeScore'

function toCreatePayload(
  values: CatEditForm,
  avatar: string,
  locationOptions: DynamicTypeOption[],
  roleOptions: DynamicTypeOption[],
  neuteredTypeValue?: string,
  attributeField: AttributeFieldName = 'attributes',
): Record<string, unknown> {
  const campusCode = normalizeCampusCode(values.campus)
  const campusNumber = Number(campusCode)
  const color = toDynamicTypeId(values.color)
  const hauntLocation = normalizeDynamicTypeValue(values.location, locationOptions)
  const role = normalizeDynamicTypeValue(values.role, roleOptions)
  const neuteredDate = normalizeDateToYmd(values.neuteredDate)
  const friendliness10 = toTenScale(toHundredScoreOrDefault(values.friendlinessScore, defaultCat.friendlinessScore))
  const gluttony10 = toTenScale(toHundredScoreOrDefault(values.gluttonyScore, defaultCat.gluttonyScore))
  const fight10 = toTenScale(toHundredScoreOrDefault(values.fightScore, defaultCat.fightScore))
  const appearance10 = toTenScale(toHundredScoreOrDefault(values.appearanceScore, defaultCat.appearanceScore))
  const attributes = {
    friendliness: friendliness10,
    gluttony: gluttony10,
    fight: fight10,
    appearance: appearance10,
  }
  const selectedNeuteredType = resolveNeuteredType(neuteredTypeValue || values.neuteredType)
  const neuteredType = toNeuteredTypeCode(selectedNeuteredType)
  const isNeutered = selectedNeuteredType !== 'NONE'

  if (color === null) {
    throw new Error('请选择花色')
  }

  if (hauntLocation === undefined) {
    throw new Error('请选择常驻位置')
  }

  if (role === undefined) {
    throw new Error('请选择猫咪角色')
  }

  const shouldSendNeuteredDate = isNeutered && /^\d{4}-\d{2}-\d{2}$/.test(neuteredDate)
  const neuteredPayload: Record<string, unknown> = {
    isNeutered,
    type: neuteredType,
  }

  if (shouldSendNeuteredDate) {
    neuteredPayload.date = neuteredDate
    neuteredPayload.neuteredDate = neuteredDate
  }

  const payload: Record<string, unknown> = {
    name: values.name.trim(),
    avatar,
    color,
    gender: toGenderCode(values.gender),
    campus: campusNumber,
    hauntLocation,
    role,
    status: toCatStatusCode(values.status),
    tags: normalizeDynamicTypeIds(values.tags),
    isNeutered,
    neuteredType,
    neutered: neuteredPayload,
    description: values.description?.trim() ?? '',
    ...(shouldSendNeuteredDate ? { neuteredDate } : {}),
  }

  payload[attributeField] = attributes
  return payload
}

function getNeuteredTypeCandidates(uiType: string, rawType: string): string[] {
  const candidates: string[] = []
  const push = (value?: string) => {
    const item = (value || '').trim()
    if (!item || candidates.includes(item)) return
    candidates.push(item)
  }

  const resolvedUiType = resolveNeuteredType(uiType)
  const raw = rawType.trim()
  push(resolvedUiType)
  if (raw && resolveNeuteredType(raw) === resolvedUiType) push(raw)

  if (resolvedUiType === 'EAR_CUT') {
    ;['EAR_CUT', 'CUT_EAR', 'EAR_MARK', 'EAR'].forEach(push)
  } else if (resolvedUiType === 'NONE') {
    ;['NONE', 'NOT_NEUTERED', 'UNNEUTERED', 'NO'].forEach(push)
  } else {
    ;['NORMAL', 'NEUTERED'].forEach(push)
  }

  return candidates
}

function normalizeTagValues(values: unknown, options: DynamicTypeOption[]): number[] {
  const labelToId = new Map(options.map((option) => [option.label, option.value]))

  return asArray<unknown>(values)
    .map((value) => {
      const directId = toDynamicTypeId(value)
      if (directId !== null) return directId

      const record = asRecord(value)
      const recordId = toDynamicTypeId(record.id ?? record.value ?? record.typeId ?? record.key)
      if (recordId !== null) return recordId

      const label = asString(record.label || record.name || record.tag || record.title || record.content || record.typeName || value)
      return labelToId.get(label) ?? null
    })
    .filter((item): item is number => item !== null)
}

function normalizeDynamicTypeValue(value: unknown, options: DynamicTypeOption[]): number | undefined {
  const directId = toDynamicTypeId(value)
  if (directId !== null) return directId

  const record = asRecord(value)
  const recordId = toDynamicTypeId(record.id ?? record.value ?? record.typeId ?? record.key)
  if (recordId !== null) return recordId

  const label = asString(record.label || record.name || record.tag || record.title || record.content || record.typeName || value)
  return options.find((option) => option.label === label)?.value
}

export function AdminCatEditPage() {
  usePageTitle('编辑猫咪档案')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const location = useLocation()
  const { id = '1' } = useParams()
  const isCreateMode = id === 'new'
  const [form] = Form.useForm<CatEditForm>()
  const [initialized, setInitialized] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [loadedNeuteredTypeRaw, setLoadedNeuteredTypeRaw] = useState('')
  const [successModalOpen, setSuccessModalOpen] = useState(false)
  const avatarInputId = 'admin-cat-avatar-upload'

  const currentStatus = Form.useWatch('status', form)
  const selectedColor = Form.useWatch('color', form)
  const neuteredType = Form.useWatch('neuteredType', form)
  const selectedTags = Form.useWatch('tags', form) ?? []
  const friendlinessScore = Form.useWatch('friendlinessScore', form) ?? defaultCat.friendlinessScore
  const gluttonyScore = Form.useWatch('gluttonyScore', form) ?? defaultCat.gluttonyScore
  const fightScore = Form.useWatch('fightScore', form) ?? defaultCat.fightScore
  const appearanceScore = Form.useWatch('appearanceScore', form) ?? defaultCat.appearanceScore

  const catFromState = useMemo(() => {
    const stateRecord = asRecord(location.state)
    return toEditableCat(stateRecord.cat)
  }, [location.state])

  const detailQuery = useQuery({
    queryKey: ['cat-detail', id],
    queryFn: () => getCatDetail(id),
    enabled: !isCreateMode,
  })

  const colorsQuery = useQuery({
    queryKey: ['type', 'colors'],
    queryFn: getColors,
  })
  const colorOptions = useMemo(() => normalizeDynamicTypeOptions(colorsQuery.data?.data), [colorsQuery.data?.data])

  const tagsQuery = useQuery({
    queryKey: ['type', 'tags'],
    queryFn: getTags,
  })
  const tagOptions = useMemo(() => normalizeDynamicTypeOptions(tagsQuery.data?.data), [tagsQuery.data?.data])

  const locationsQuery = useQuery({
    queryKey: ['type', 'locations'],
    queryFn: getLocations,
  })
  const locationOptions = useMemo(() => normalizeDynamicTypeOptions(locationsQuery.data?.data), [locationsQuery.data?.data])

  const rolesQuery = useQuery({
    queryKey: ['type', 'roles'],
    queryFn: getRoles,
  })
  const roleOptions = useMemo(() => normalizeDynamicTypeOptions(rolesQuery.data?.data), [rolesQuery.data?.data])

  const catFromQuery = useMemo(() => toEditableCat(detailQuery.data?.data), [detailQuery.data?.data])

  useEffect(() => {
    setInitialized(false)
  }, [id])

  useEffect(() => {
    if (initialized) return
    if (!isCreateMode && detailQuery.isLoading) return
    if (colorsQuery.isLoading) return
    if (tagsQuery.isLoading) return
    if (locationsQuery.isLoading) return
    if (rolesQuery.isLoading) return

    const seed = isCreateMode ? defaultCat : (catFromQuery ?? catFromState ?? defaultCat)
    form.setFieldsValue({
      name: seed.name,
      color: normalizeDynamicTypeValue(seed.color, colorOptions),
      gender: seed.gender,
      campus: seed.campus,
      location: normalizeDynamicTypeValue(seed.location, locationOptions) ?? locationOptions[0]?.value,
      role: normalizeDynamicTypeValue(seed.role, roleOptions) ?? roleOptions[0]?.value,
      status: seed.status,
      neuteredType: seed.neuteredType,
      neuteredDate: seed.neuteredDate,
      description: seed.description,
      tags: normalizeTagValues(seed.tags, tagOptions),
      friendlinessScore: seed.friendlinessScore,
      gluttonyScore: seed.gluttonyScore,
      fightScore: seed.fightScore,
      appearanceScore: seed.appearanceScore,
    })
    setAvatarPreview(seed.avatar)
    setAvatarFile(null)
    setLoadedNeuteredTypeRaw(seed.neuteredTypeRaw || '')
    setInitialized(true)
  }, [catFromQuery, catFromState, colorOptions, colorsQuery.isLoading, detailQuery.isLoading, form, initialized, isCreateMode, locationOptions, locationsQuery.isLoading, roleOptions, rolesQuery.isLoading, tagOptions, tagsQuery.isLoading])

  useEffect(() => {
    if (neuteredType !== 'NONE') return
    const currentDate = form.getFieldValue('neuteredDate')
    const normalizedDate = normalizeDateToYmd(currentDate)
    if (currentDate !== normalizedDate) {
      form.setFieldValue('neuteredDate', normalizedDate)
    }
  }, [form, neuteredType])

  const mutation = useMutation({
    mutationFn: async (values: CatEditForm) => {
      const targetId = isCreateMode ? undefined : id
      const rawAvatar = avatarPreview.trim()
      const avatar = await resolveAvatarForSubmit(avatarFile, rawAvatar, targetId)
      const neuteredTypeCandidates = getNeuteredTypeCandidates(values.neuteredType, loadedNeuteredTypeRaw)
      const attributeFieldCandidates: AttributeFieldName[] = ['attributes', 'attributeScore']

      let lastError: unknown = null
      for (const neuteredTypeValue of neuteredTypeCandidates) {
        for (const attributeField of attributeFieldCandidates) {
          try {
            return await upsertAdminCat(toCreatePayload(values, avatar, locationOptions, roleOptions, neuteredTypeValue, attributeField), targetId)
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : ''
            const isBadRequest = error instanceof ApiError && error.shape.httpStatus === 400
            const isDbError = error instanceof ApiError && error.shape.httpStatus === 500
            const isNeuteredTypeError = /neutered|绝育/i.test(errorMessage)
            const isAttributePayloadError = /attribute|属性/i.test(errorMessage)

            if (isBadRequest && isNeuteredTypeError) {
              lastError = error
              break
            }

            const shouldTryAlternateAttributeField =
              attributeField === 'attributes' && (isDbError || isAttributePayloadError)
            if (shouldTryAlternateAttributeField) {
              lastError = error
              continue
            }

            throw error
          }
        }
      }

      throw (lastError instanceof Error ? lastError : new Error('保存失败，请稍后重试'))
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cat-detail', id] })
      void queryClient.invalidateQueries({ queryKey: ['admin-cats'] })
      void queryClient.invalidateQueries({ queryKey: ['cats'] })
      setSuccessModalOpen(true)
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '保存失败，请稍后重试'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteAdminCat(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['cat-detail', id] })
      void queryClient.invalidateQueries({ queryKey: ['admin-cats'] })
      void queryClient.invalidateQueries({ queryKey: ['cats'] })
      Modal.success({
        centered: true,
        title: '删除成功',
        content: '猫咪档案已删除。',
        okText: '返回档案页',
        onOk: () => navigate('/admin/cats', { replace: true }),
      })
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '删除失败，请稍后重试'),
  })

  const onAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      message.warning('请选择图片文件')
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = (loadEvent) => {
      if (typeof loadEvent.target?.result === 'string') {
        setAvatarPreview(loadEvent.target.result)
        setAvatarFile(file)
      }
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const handleSuccessModalClose = () => {
    setSuccessModalOpen(false)
    navigate(isCreateMode ? '/admin/cats' : `/admin/cats/${id}`, { replace: true })
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-36">
      <section className="mb-5 rounded-b-[24px] bg-white px-5 pb-5 pt-5 shadow-[0_2px_15px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="top-icon-btn !rounded-xl !bg-[#f5f5f5]" onClick={() => navigate(-1)} type="button">
              <ArrowLeftOutlined />
            </button>
            <h1 className="text-[20px] font-bold text-[#2c3e50]">{isCreateMode ? '新增猫咪档案' : '编辑猫咪档案'}</h1>
          </div>
          <button
            className="text-[14px] text-[#7f8c8d] disabled:text-[#cbd5e1]"
            disabled={isCreateMode || deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
            type="button"
          >
            删除
          </button>
        </div>
      </section>

      <div className="h5-content pt-0">
        <div className="mb-4 rounded-[20px] bg-white p-5 text-center shadow-[0_4px_15px_rgba(0,0,0,0.03)]">
          <label
            className="mx-auto flex h-[120px] w-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-black/10 bg-[#f5f5f5]"
            htmlFor={avatarInputId}
          >
            {avatarPreview ? (
              <img alt="猫咪头像" className="h-full w-full object-cover" src={avatarPreview} />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#d1d5db] to-[#94a3b8] text-white/85">
                <CameraOutlined className="text-[26px]" />
              </div>
            )}
          </label>
          <input accept="image/*" className="hidden" id={avatarInputId} onChange={onAvatarChange} type="file" />
          <p className="mt-2 text-[12px] text-[#7f8c8d]">点击图片更换头像</p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => mutation.mutate(values)}
        >
          <section className="mb-4 rounded-[20px] bg-white p-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)]">
            <p className="mb-4 text-[14px] font-bold uppercase tracking-wide text-[#7f8c8d]">基础信息</p>

            <Form.Item label="猫咪名字" name="name" rules={[{ required: true, message: '请输入猫咪名字' }]}>
              <Input className="!h-11 !rounded-xl !border-none !bg-[#f8f9fa]" />
            </Form.Item>

            <div className="grid grid-cols-2 gap-3">
              <Form.Item label="花色" name="color" rules={[{ required: true, message: '请选择花色' }]}>
                <QueryState error={colorsQuery.error} isLoading={colorsQuery.isLoading}>
                  <Select
                    className="w-full"
                    options={colorOptions}
                    placeholder="请选择花色"
                    value={selectedColor}
                    onChange={(value) => form.setFieldValue('color', value)}
                  />
                </QueryState>
              </Form.Item>
              <Form.Item label="性别" name="gender" rules={[{ required: true, message: '请选择性别' }]}>
                <Select
                  className="w-full"
                  options={[
                    { label: '母猫', value: 'FEMALE' },
                    { label: '公猫', value: 'MALE' },
                    { label: '未知', value: 'UNKNOWN' },
                  ]}
                />
              </Form.Item>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Form.Item label="所在校区" name="campus" rules={[{ required: true, message: '请选择所在校区' }]}>
                <Select className="w-full" options={campusOptions} />
              </Form.Item>
              <Form.Item label="常驻位置" name="location" rules={[{ required: true, message: '请选择常驻位置' }]}>
                <QueryState error={locationsQuery.error} isLoading={locationsQuery.isLoading}>
                  <Select
                    className="w-full"
                    options={locationOptions}
                    placeholder={locationOptions.length ? '请选择常驻位置' : '暂无位置类型'}
                  />
                </QueryState>
              </Form.Item>
            </div>

            <Form.Item label="猫咪角色" name="role" rules={[{ required: true, message: '请选择猫咪角色' }]}>
              <QueryState error={rolesQuery.error} isLoading={rolesQuery.isLoading}>
                <Select
                  className="w-full"
                  options={roleOptions}
                  placeholder={roleOptions.length ? '请选择猫咪角色' : '暂无角色类型'}
                />
              </QueryState>
            </Form.Item>
          </section>

          <section className="mb-4 rounded-[20px] bg-white p-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)]">
            <p className="mb-3 text-[14px] font-bold uppercase tracking-wide text-[#7f8c8d]">状态设置</p>
            <Form.Item className="!mb-0" name="status" rules={[{ required: true, message: '请选择状态' }]}>
              <div className="grid grid-cols-2 gap-2">
                {statusOptions.map((option) => {
                  const active = currentStatus === option.value
                  return (
                    <button
                      aria-pressed={active}
                      key={option.value}
                      className={clsx(
                        'rounded-2xl border-2 px-3 py-3 text-center text-[13px] transition',
                        active ? option.activeClass : 'border-transparent bg-[#f8f9fa] text-[#7f8c8d]',
                      )}
                      onClick={() => form.setFieldValue('status', option.value)}
                      type="button"
                    >
                      <span className="mb-1 block text-[18px]">{option.icon}</span>
                      <span className="font-semibold">{option.label}</span>
                    </button>
                  )
                })}
              </div>
            </Form.Item>
          </section>

          <section className="mb-4 rounded-[20px] bg-white p-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)]">
            <p className="mb-3 text-[14px] font-bold uppercase tracking-wide text-[#7f8c8d]">属性评分</p>

            <Form.Item className="!mb-4" label="亲人指数" name="friendlinessScore" rules={[{ required: true, message: '请设置亲人指数' }]}>
              <div>
                <div className="mb-2 flex items-center justify-between text-[13px]">
                  <span className="text-[#7f8c8d]">当前值</span>
                  <span className="font-bold text-[#f59e0b]">{friendlinessScore}</span>
                </div>
                <input
                  className="w-full accent-[#f59e0b]"
                  max={100}
                  min={0}
                  onChange={(event) => form.setFieldValue('friendlinessScore', Number(event.target.value))}
                  type="range"
                  value={friendlinessScore}
                />
              </div>
            </Form.Item>

            <Form.Item className="!mb-4" label="贪吃指数" name="gluttonyScore" rules={[{ required: true, message: '请设置贪吃指数' }]}>
              <div>
                <div className="mb-2 flex items-center justify-between text-[13px]">
                  <span className="text-[#7f8c8d]">当前值</span>
                  <span className="font-bold text-[#fbbf24]">{gluttonyScore}</span>
                </div>
                <input
                  className="w-full accent-[#fbbf24]"
                  max={100}
                  min={0}
                  onChange={(event) => form.setFieldValue('gluttonyScore', Number(event.target.value))}
                  type="range"
                  value={gluttonyScore}
                />
              </div>
            </Form.Item>

            <Form.Item className="!mb-4" label="战斗力" name="fightScore" rules={[{ required: true, message: '请设置战斗力' }]}>
              <div>
                <div className="mb-2 flex items-center justify-between text-[13px]">
                  <span className="text-[#7f8c8d]">当前值</span>
                  <span className="font-bold text-[#16a34a]">{fightScore}</span>
                </div>
                <input
                  className="w-full accent-[#16a34a]"
                  max={100}
                  min={0}
                  onChange={(event) => form.setFieldValue('fightScore', Number(event.target.value))}
                  type="range"
                  value={fightScore}
                />
              </div>
            </Form.Item>

            <Form.Item className="!mb-0" label="颜值指数" name="appearanceScore" rules={[{ required: true, message: '请设置颜值指数' }]}>
              <div>
                <div className="mb-2 flex items-center justify-between text-[13px]">
                  <span className="text-[#7f8c8d]">当前值</span>
                  <span className="font-bold text-[#ec4899]">{appearanceScore}</span>
                </div>
                <input
                  className="w-full accent-[#ec4899]"
                  max={100}
                  min={0}
                  onChange={(event) => form.setFieldValue('appearanceScore', Number(event.target.value))}
                  type="range"
                  value={appearanceScore}
                />
              </div>
            </Form.Item>
          </section>

          <section className="mb-4 rounded-[20px] bg-white p-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)]">
            <p className="mb-3 text-[14px] font-bold uppercase tracking-wide text-[#7f8c8d]">标签特征</p>
            <Form.Item className="!mb-0" name="tags">
              <QueryState error={tagsQuery.error} isLoading={tagsQuery.isLoading}>
                <div className="flex flex-wrap gap-2">
                  {tagOptions.map((tag) => {
                    const active = selectedTags.includes(tag.value)
                    return (
                      <button
                        key={tag.value}
                        className={clsx(
                          'rounded-full border px-3 py-1.5 text-[13px] transition',
                          active
                            ? 'border-transparent bg-[#ffd54f] font-semibold text-[#5d4037] shadow-[0_4px_10px_rgba(255,213,79,0.3)]'
                            : 'border-transparent bg-[#f5f5f5] text-[#7f8c8d]',
                        )}
                        onClick={() => {
                          const next = active ? selectedTags.filter((item) => item !== tag.value) : [...selectedTags, tag.value]
                          form.setFieldValue('tags', next)
                        }}
                        type="button"
                      >
                        {tag.label}
                      </button>
                    )
                  })}
                </div>
              </QueryState>
            </Form.Item>
          </section>

          <section className="mb-4 rounded-[20px] bg-white p-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)]">
            <p className="mb-4 text-[14px] font-bold uppercase tracking-wide text-[#7f8c8d]">其他信息</p>

            <div className="grid grid-cols-2 gap-3">
              <Form.Item label="绝育方式" name="neuteredType">
                <Select
                  options={[
                    { label: '已绝育（剪耳）', value: 'EAR_CUT' },
                    { label: '已绝育（未剪耳）', value: 'NORMAL' },
                    { label: '未绝育', value: 'NONE' },
                  ]}
                />
              </Form.Item>

              <Form.Item label="绝育日期" name="neuteredDate">
                <Input className="!h-11 !rounded-xl !border-none !bg-[#f8f9fa]" type="date" />
              </Form.Item>
            </div>

            <Form.Item label="备注描述" name="description">
              <Input.TextArea className="!rounded-xl !border-none !bg-[#f8f9fa]" rows={4} />
            </Form.Item>
          </section>
        </Form>

        {!isCreateMode && detailQuery.error instanceof ApiNotFoundError ? <ApiUnavailable title="猫咪详情接口暂不可用" /> : null}
        {mutation.error instanceof ApiNotFoundError ? <ApiUnavailable title="猫咪保存接口暂不可用" /> : null}
      </div>

      <div className="fixed bottom-6 left-1/2 z-30 grid w-[min(350px,calc(100%-34px))] -translate-x-1/2 grid-cols-1 gap-3 rounded-3xl border border-white/40 bg-white/90 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.1)] backdrop-blur-xl">
        <Button
          className="!h-12 !rounded-2xl !border-none !text-[14px] !font-bold !text-[#5d4037]"
          loading={mutation.isPending}
          onClick={() => form.submit()}
          style={{
            background: 'linear-gradient(135deg, #FFD54F 0%, #FFCA28 100%)',
            boxShadow: '0 4px 15px rgba(255, 213, 79, 0.4)',
          }}
          type="text"
        >
          保存档案
        </Button>
      </div>

      <Modal
        centered
        cancelButtonProps={{ style: { display: 'none' } }}
        okText="返回管理页"
        open={successModalOpen}
        title="保存成功"
        onCancel={handleSuccessModalClose}
        onOk={handleSuccessModalClose}
      >
        <p className="mb-0">猫咪档案已保存。</p>
      </Modal>
    </div>
  )
}
