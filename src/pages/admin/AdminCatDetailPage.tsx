import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Modal, message } from 'antd'
import clsx from 'clsx'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { ApiError, ApiNotFoundError } from '@/api/adapters/errors'
import { normalizeDynamicTypeLabel, normalizeDynamicTypeOptions, type DynamicTypeOption } from '@/api/adapters/types'
import { upsertAdminCat } from '@/api/endpoints/admin'
import { getCatDetail } from '@/api/endpoints/cats'
import { getLocations, getRoles } from '@/api/endpoints/types'
import { ApiUnavailable } from '@/components/feedback/ApiUnavailable'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asArray, asNumber, asRecord, asString } from '@/utils/format'
import { normalizeMediaUrl } from '@/utils/media'
import { DeleteOutlined } from '@ant-design/icons'
import { deleteMoment, getMoments } from '@/api/endpoints/moments'
import type { ApiResult } from '@/types/api'
import { toPaged } from '@/utils/format'

type CatStatus = '在校' | '待领养' | '已领养' | '已毕业' | '治疗中' | '喵星'

type RelationItem = {
  id: string
  name: string
  relation: string
  avatar: string
}

type MomentView = {
  id: string
  content: string
  image: string
  userName: string
  userAvatar: string
  createTime: string
}

type CatDetailView = {
  id: string
  name: string
  avatar: string
  gender: string
  status: CatStatus
  role: string
  color: string
  location: string
  neuteredLabel: string
  recordAge: string
  friendliness: number
  gluttony: number
  appearance: number
  fight: number
  description: string
  tags: string[]
  relationships: RelationItem[]
}

const fallbackDetail: CatDetailView = {
  id: '1',
  name: '麻薯',
  avatar: 'https://loremflickr.com/640/640/cat?lock=56',
  gender: 'FEMALE',
  status: '在校',
  role: '校园猫',
  color: '三花',
  location: '软件园校区',
  neuteredLabel: '已绝育',
  recordAge: '1.5 年',
  friendliness: 90,
  gluttony: 95,
  appearance: 99,
  fight: 40,
  description: '进食时不喜欢被摸头，偶尔会哈气。',
  tags: ['亲人', '吃货', '粘人'],
  relationships: [],
}

function toStatus(rawStatus: unknown): CatStatus {
  const status = asString(rawStatus).trim().toUpperCase()
  if (!status) return '在校'
  if (status.includes('PENDING') || status.includes('WAIT') || status.includes('待领')) return '待领养'
  if (status.includes('TREAT') || status.includes('HOSPITAL') || status.includes('治疗')) return '治疗中'
  if (status.includes('MEOW') || status.includes('STAR') || status.includes('喵星')) return '喵星'
  if (status.includes('GRADUATE') || status.includes('毕业')) return '已毕业'
  if (status.includes('ADOPTED') || status.includes('已领养')) return '已领养'
  return '在校'
}

function toPercent(raw: unknown): number {
  const value = asNumber(raw, Number.NaN)
  if (!Number.isFinite(value)) return 0
  if (value <= 1) return Math.max(0, Math.min(100, Math.round(value * 100)))
  if (value <= 10) return Math.max(0, Math.min(100, Math.round(value * 10)))
  return Math.max(0, Math.min(100, Math.round(value)))
}

function toRecordAge(rawDate: unknown): string {
  const text = asString(rawDate)
  if (!text) return '--'
  const date = new Date(text)
  if (Number.isNaN(date.getTime())) return '--'

  const now = new Date()
  const months = Math.max(0, (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth()))
  if (months < 1) return '< 1 个月'
  if (months < 12) return `${months} 个月`
  return `${(months / 12).toFixed(1)} 年`
}

function toNeuteredLabel(rawNeutered: unknown): string {
  const neutered = asRecord(rawNeutered)
  const isNeutered = neutered.isNeutered === true
  if (!isNeutered) return '未绝育'

  const type = firstPresent(neutered.type, neutered.neuteredType)
  const typeText = typeof type === 'string' ? type.trim() : ''
  const normalizedTypeText = typeText.toUpperCase()
  const typeId = typeof type === 'number' && Number.isFinite(type) ? type : typeText ? Number(typeText) : Number.NaN
  if (typeId === 0) return '已绝育（剪耳）'
  if (typeId === 1) return '已绝育（未剪耳）'
  if (
    normalizedTypeText.includes('NORMAL') ||
    normalizedTypeText.includes('UNCUT') ||
    normalizedTypeText.includes('NO_CUT') ||
    normalizedTypeText.includes('NO CUT') ||
    normalizedTypeText.includes('NOT_CUT') ||
    normalizedTypeText.includes('NOT CUT') ||
    typeText.includes('未剪耳') ||
    typeText.includes('无耳标')
  ) {
    return '已绝育（未剪耳）'
  }
  if (normalizedTypeText.includes('EAR') || normalizedTypeText.includes('CUT') || typeText.includes('剪耳') || typeText.includes('耳尖')) {
    return '已绝育（剪耳）'
  }
  return '已绝育'
}

function firstPresent(...values: unknown[]): unknown {
  return values.find((value) => {
    if (value === null || value === undefined) return false
    return typeof value !== 'string' || value.trim().length > 0
  })
}

function toId(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value.trim() || fallback
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return fallback
}

function formatMomentTime(value: unknown): string {
  const raw = asString(value)
  if (!raw) return '--'

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw

  return `${date.getMonth() + 1}-${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function getMomentMedia(row: Record<string, unknown>): string {
  const media = asArray<string>(row.media || row.medium || row.images)
  return normalizeMediaUrl(firstPresent(media[0], row.image, row.imageUrl, row.cover))
}

function isMomentRelatedToCat(item: unknown, catId: string): boolean {
  const row = asRecord(item)
  const directId = toId(firstPresent(row.catId, row.relatedCatId))
  if (directId === catId) return true

  const relatedRecord = asRecord(row.relatedCat || row.cat)
  if (toId(firstPresent(relatedRecord.id, relatedRecord.catId)) === catId) return true

  return asArray<unknown>(row.relatedCats || row.cats).some((cat) => {
    const catRecord = asRecord(cat)
    return toId(firstPresent(catRecord.id, catRecord.catId, cat)) === catId
  })
}

function normalizeMoment(item: unknown, index: number): MomentView {
  const row = asRecord(item)
  const user = asRecord(row.user || row.author || row.publisher)

  return {
    id: toId(firstPresent(row.id, row.postId, row.momentId), String(index + 1)),
    content: asString(row.content || row.text || row.description, '暂无动态内容'),
    image: getMomentMedia(row),
    userName: asString(firstPresent(row.userName, row.nickname, row.authorName, user.nickname, user.name), '用户'),
    userAvatar: normalizeMediaUrl(firstPresent(row.userAvatar, row.avatar, user.avatar, user.userAvatar)),
    createTime: formatMomentTime(firstPresent(row.createTime, row.createdAt, row.updateTime, row.updatedAt)),
  }
}

function removeMomentFromState(items: unknown, momentId: string): Record<string, unknown>[] {
  return asArray<Record<string, unknown>>(items).filter((item) => {
    const row = asRecord(item)
    return toId(firstPresent(row.id, row.postId, row.momentId)) !== momentId
  })
}

function requireSuccessfulResult<T>(result: ApiResult<T>, fallbackMessage: string): ApiResult<T> {
  if (typeof result.code === 'number' && result.code >= 400) {
    throw new Error(result.message || fallbackMessage)
  }
  return result
}

function normalizeCatDetail(
  payload: unknown,
  id: string,
  roleOptions: DynamicTypeOption[],
  locationOptions: DynamicTypeOption[],
): CatDetailView | null {
  const row = asRecord(payload)
  if (!Object.keys(row).length) return null

  const basicInfo = asRecord(row.basicInfo)
  const attributes = asRecord(row.attributes || row.attributeScore)
  const neutered = basicInfo.neutered ?? row.neutered
  const relationships = asArray<Record<string, unknown>>(row.relationship).map((item, index) => ({
    id: asString(item.catId || item.id, String(index + 1)),
    name: asString(item.name, `关系${index + 1}`),
    relation: asString(item.relation, '同伴'),
    avatar: normalizeMediaUrl(item.avatar),
  }))

  return {
    id: asString(row.id, id),
    name: asString(row.name, '猫咪'),
    avatar: normalizeMediaUrl(row.avatar || asArray<string>(row.images)[0]),
    gender: asString(basicInfo.gender || row.gender, 'UNKNOWN'),
    status: toStatus(basicInfo.status || row.status),
    role: normalizeDynamicTypeLabel(firstPresent(basicInfo.roleName, row.roleName, basicInfo.role, row.role), roleOptions, '校园猫'),
    color: asString(basicInfo.color || row.color, '未知'),
    location: normalizeDynamicTypeLabel(
      firstPresent(basicInfo.hauntLocationName, row.hauntLocationName, basicInfo.hauntLocation, row.hauntLocation, row.locationName, row.location),
      locationOptions,
      '未知',
    ),
    neuteredLabel: toNeuteredLabel(neutered),
    recordAge: toRecordAge(basicInfo.admissionDate || row.admissionDate),
    friendliness: toPercent(attributes.friendliness),
    gluttony: toPercent(attributes.gluttony),
    appearance: toPercent(attributes.appearance),
    fight: toPercent(attributes.fight),
    description: asString(row.description, '暂无备注'),
    tags: asArray<string>(row.tags).filter(Boolean),
    relationships,
  }
}

function isRecoverableCatDetailError(error: unknown): boolean {
  if (error instanceof ApiNotFoundError) return true
  return error instanceof ApiError && error.shape.httpStatus !== null && error.shape.httpStatus >= 500
}

const statusBadgeClass: Record<CatStatus, string> = {
  在校: 'bg-[#16a34a] text-white',
  待领养: 'bg-[#ef4444] text-white',
  已领养: 'bg-[#16a34a] text-white',
  已毕业: 'bg-[#64748b] text-white',
  治疗中: 'bg-[#f97316] text-white',
  喵星: 'bg-[#eab308] text-[#5d4037]',
}

export function AdminCatDetailPage() {
  usePageTitle('猫咪详情')
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [deleteSuccessOpen, setDeleteSuccessOpen] = useState(false)

  const query = useQuery({
    queryKey: ['cat-detail', id],
    queryFn: () => getCatDetail(id),
  })
  const rolesQuery = useQuery({
    queryKey: ['type', 'roles'],
    queryFn: getRoles,
  })
  const roleOptions = useMemo(() => normalizeDynamicTypeOptions(rolesQuery.data?.data), [rolesQuery.data?.data])
  const locationsQuery = useQuery({
    queryKey: ['type', 'locations'],
    queryFn: getLocations,
  })
  const locationOptions = useMemo(() => normalizeDynamicTypeOptions(locationsQuery.data?.data), [locationsQuery.data?.data])

  const momentsQuery = useQuery({
    queryKey: ['cat-moments', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const scoped = await getMoments({ page: 1, pageSize: 30, catId: id })
      const scopedItems = toPaged<Record<string, unknown>>(scoped.data).items
      const scopedRelatedItems = scopedItems.filter((moment) => isMomentRelatedToCat(moment, id))
      if (scopedRelatedItems.length) return scopedRelatedItems
      if (scopedItems.length) return scopedItems

      const all = await getMoments({ page: 1, pageSize: 60 })
      return toPaged<Record<string, unknown>>(all.data).items.filter((moment) => isMomentRelatedToCat(moment, id))
    },
  })

  const detail = useMemo(() => {
    const normalized = normalizeCatDetail(query.data?.data, id, roleOptions, locationOptions)
    if (normalized) return normalized
    if (isRecoverableCatDetailError(query.error)) return fallbackDetail
    return null
  }, [id, locationOptions, query.data?.data, query.error, roleOptions])

  const moments = useMemo(() => asArray<Record<string, unknown>>(momentsQuery.data).map(normalizeMoment), [momentsQuery.data])

  const deleteMomentMutation = useMutation<ApiResult<Record<string, unknown>>, Error, MomentView>({
    mutationFn: async (moment) => requireSuccessfulResult(await deleteMoment(moment.id), '删除失败，请稍后重试'),
    onSuccess: (_result, moment) => {
      queryClient.setQueryData<Record<string, unknown>[] | undefined>(['cat-moments', id], (previous) =>
        removeMomentFromState(previous, moment.id),
      )
      setDeleteSuccessOpen(true)
      void queryClient.invalidateQueries({ queryKey: ['cat-moments', id], refetchType: 'none' })
      void queryClient.invalidateQueries({ queryKey: ['moments'], refetchType: 'none' })
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '删除失败，请稍后重试'),
  })

  const pendingDeleteMomentId = deleteMomentMutation.isPending ? deleteMomentMutation.variables?.id : null

  const graduateMutation = useMutation({
    mutationFn: () => upsertAdminCat({ status: 'GRADUATED' }, id),
    onSuccess: () => {
      message.success('已标记毕业')
      void queryClient.invalidateQueries({ queryKey: ['cat-detail', id] })
      void queryClient.invalidateQueries({ queryKey: ['admin-cats'] })
      void queryClient.invalidateQueries({ queryKey: ['cats'] })
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '操作失败，请稍后重试'),
  })

  return (
    <div className="pb-[150px]">
      <QueryState
        error={isRecoverableCatDetailError(query.error) ? null : query.error}
        isEmpty={!query.isLoading && !query.error && !detail}
        isLoading={query.isLoading}
        emptyDescription="暂无猫咪详情"
      >
        {detail ? (
          <>
            <section className="relative h-[320px] overflow-hidden rounded-b-[40px] bg-gradient-to-br from-[#64748b] to-[#334155]">
              {detail.avatar ? <img alt={detail.name} className="h-full w-full object-cover" src={detail.avatar} /> : null}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
              <button
                className="absolute left-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full border border-white/40 bg-black/25 text-white backdrop-blur"
                onClick={() => navigate(-1)}
                type="button"
              >
                <ArrowLeftOutlined />
              </button>
              <div className="absolute bottom-8 left-5 right-5 z-10 text-white">
                <h1 className="text-[34px] font-black leading-none">
                  {detail.name}
                  <span className="ml-2 text-[20px] text-[#fda4af]">{detail.gender === 'MALE' ? '♂' : '♀'}</span>
                </h1>
                <span
                  className={clsx(
                    'mt-3 inline-flex rounded-full px-3 py-1 text-[12px] font-bold shadow-[0_6px_16px_rgba(0,0,0,0.15)]',
                    statusBadgeClass[detail.status],
                  )}
                >
                  {detail.status} ({detail.role})
                </span>
              </div>
            </section>

            <div className="-mt-4 relative z-20 h5-content pt-0">
              <div className="mb-4 grid grid-cols-2 gap-3">
                <div className="rounded-[18px] border border-black/[0.03] bg-white p-3 shadow-[0_8px_20px_rgba(0,0,0,0.04)]">
                  <p className="text-[11px] text-[#94a3b8]">花色品种</p>
                  <p className="mt-1 text-[15px] font-black text-[#1e293b]">{detail.color}</p>
                </div>
                <div className="rounded-[18px] border border-black/[0.03] bg-white p-3 shadow-[0_8px_20px_rgba(0,0,0,0.04)]">
                  <p className="text-[11px] text-[#94a3b8]">常驻据点</p>
                  <p className="mt-1 text-[15px] font-black text-[#1e293b]">{detail.location}</p>
                </div>
                <div className="rounded-[18px] border border-black/[0.03] bg-white p-3 shadow-[0_8px_20px_rgba(0,0,0,0.04)]">
                  <p className="text-[11px] text-[#94a3b8]">绝育情况</p>
                  <p className="mt-1 text-[15px] font-black text-[#1e293b]">{detail.neuteredLabel}</p>
                </div>
                <div className="rounded-[18px] border border-black/[0.03] bg-white p-3 shadow-[0_8px_20px_rgba(0,0,0,0.04)]">
                  <p className="text-[11px] text-[#94a3b8]">录入时长</p>
                  <p className="mt-1 text-[15px] font-black text-[#1e293b]">{detail.recordAge}</p>
                </div>
              </div>

              <section className="rounded-[20px] border border-black/[0.03] bg-white p-4 shadow-[0_8px_20px_rgba(0,0,0,0.04)]">
                <h2 className="mb-3 text-[15px] font-black text-[#1e293b]">用户动态</h2>
                <QueryState
                  error={momentsQuery.error}
                  isEmpty={!momentsQuery.isLoading && !momentsQuery.error && moments.length === 0}
                  isLoading={momentsQuery.isLoading}
                  emptyDescription="暂无相关动态"
                >
                  <div className="space-y-3">
                    {moments.map((moment) => (
                      <article key={moment.id} className="relative rounded-[16px] bg-[#f8fafc] p-3">
                        <button
                          aria-label="删除动态"
                          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border border-[#fee2e2] bg-white text-[15px] text-[#dc2626] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#fecaca] hover:bg-[#fff1f2] hover:shadow-[0_8px_18px_rgba(220,38,38,0.18)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={pendingDeleteMomentId === moment.id}
                          title="删除动态"
                          type="button"
                          onClick={(event) => {
                            event.preventDefault()
                            event.stopPropagation()
                            deleteMomentMutation.mutate(moment)
                          }}
                        >
                          <DeleteOutlined />
                        </button>

                        <div className="mb-3 flex items-center gap-2 pr-12">
                          <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-[#d1d5db] to-[#94a3b8]">
                            {moment.userAvatar ? (
                              <img alt={moment.userName} className="h-full w-full object-cover" src={moment.userAvatar} />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[12px] font-bold text-[#334155]">{moment.userName}</p>
                            <p className="text-[10px] text-[#94a3b8]">{moment.createTime}</p>
                          </div>
                        </div>

                        <p className="text-[13px] leading-5 text-[#334155]">{moment.content}</p>
                        {moment.image ? (
                          <img alt="动态图片" className="mt-3 h-32 w-full rounded-xl object-cover" src={moment.image} />
                        ) : null}
                      </article>
                    ))}
                  </div>
                </QueryState>
              </section>
            </div>
          </>
        ) : null}
      </QueryState>

      {isRecoverableCatDetailError(query.error) ? (
        <div className="h5-content mt-4">
          <ApiUnavailable onRetry={() => query.refetch()} title="猫咪详情接口暂不可用，当前展示设计稿态" />
        </div>
      ) : null}

      {detail ? (
        <div className="fixed bottom-6 left-1/2 z-30 grid w-[min(350px,calc(100%-34px))] -translate-x-1/2 gap-2 rounded-3xl border border-white/40 bg-white/85 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.12)] backdrop-blur-xl">
          <Link
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#10b981] to-[#059669] text-[14px] font-bold text-white"
            state={{ cat: query.data?.data }}
            to={`/admin/cats/${id}/edit`}
          >
            <EditOutlined />
            编辑详情档案
          </Link>
          <Button
            className="!h-11 !rounded-xl !border-[#fecdd3] !bg-white !text-[14px] !font-bold !text-[#e11d48]"
            disabled={detail.status === '已毕业'}
            loading={graduateMutation.isPending}
            onClick={() => graduateMutation.mutate()}
            type="default"
          >
            {detail.status === '已毕业' ? '已标记毕业' : '标记毕业'}
          </Button>
        </div>
      ) : null}

      <Modal
        cancelButtonProps={{ style: { display: 'none' } }}
        okText="知道了"
        open={deleteSuccessOpen}
        title="动态已删除"
        onCancel={() => setDeleteSuccessOpen(false)}
        onOk={() => setDeleteSuccessOpen(false)}
      >
        <p className="text-[14px] leading-6 text-[#334155]">该用户动态已从猫咪详情页移除。</p>
      </Modal>
    </div>
  )
}
