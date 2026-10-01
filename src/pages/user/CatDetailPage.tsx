import {
  ArrowLeftOutlined,
  CameraOutlined,
  EnvironmentOutlined,
  ExclamationCircleFilled,
  GiftOutlined,
  HeartFilled,
  HomeOutlined,
  DeleteOutlined,
  LikeFilled,
  LikeOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Modal, Progress, message } from 'antd'
import { useMemo } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'

import { normalizeDynamicTypeLabel, normalizeDynamicTypeOptions } from '@/api/adapters/types'
import { feedCat, getCatDetail } from '@/api/endpoints/cats'
import { deleteMoment, getMoments, likeMoment, unlikeMoment } from '@/api/endpoints/moments'
import { getLocations, getRoles } from '@/api/endpoints/types'
import { getMe } from '@/api/endpoints/user'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'
import type { ApiResult } from '@/types/api'
import { asArray, asRecord, asString, toPaged } from '@/utils/format'

type MomentView = {
  id: string
  content: string
  image: string
  userId: string
  userName: string
  userAvatar: string
  createTime: string
  liked: boolean
  likeCount: number
}

type ToggleMomentLikeVariables = {
  moment: MomentView
}

type ToggleMomentLikeContext = {
  previousMoments?: Record<string, unknown>[]
  previousMe?: ApiResult<Record<string, unknown>>
  isOwnMoment: boolean
  delta: number
}

type DeleteMomentVariables = {
  moment: MomentView
}

function toTenScale(value?: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0
  if (value <= 1) return Number((value * 10).toFixed(1))
  if (value <= 10) return Number(value.toFixed(1))
  if (value <= 100) return Number((value / 10).toFixed(1))
  return 10
}

function toPercentFromTen(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value * 10)))
}

function formatMomentTime(value: unknown): string {
  const raw = asString(value)
  if (!raw) return '刚刚'

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) return raw

  return `${date.getMonth() + 1}-${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

function normalizeRoleText(value: unknown): string {
  const role = asString(value).trim()
  return !role || /^\d+$/.test(role) ? '流浪游侠' : role
}

function normalizeLocationText(value: unknown): string {
  const location = asString(value).trim()
  return !location || /^\d+$/.test(location) ? '未知' : location
}

function toId(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value.trim() || fallback
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return fallback
}

function toOptionalNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value.trim())
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

function toOptionalBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number' && Number.isFinite(value)) return value > 0
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (['true', '1', 'yes', 'y'].includes(normalized)) return true
    if (['false', '0', 'no', 'n'].includes(normalized)) return false
  }
  return null
}

function firstNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const parsed = toOptionalNumber(value)
    if (parsed !== null) return parsed
  }
  return null
}

function readProfileCurrency(profile: unknown): number {
  const me = asRecord(profile)
  const stats = asRecord(me.stats)
  const currency = firstNumber(me.currency, me.userCurrency, me.fishPoints, stats.fishPoints, stats.points, stats.score)
  return Math.max(0, currency ?? 0)
}

function requireSuccessfulResult<T>(result: ApiResult<T>, fallbackMessage: string): ApiResult<T> {
  if (typeof result.code === 'number' && result.code >= 400) {
    throw new Error(result.message || fallbackMessage)
  }
  return result
}

function readProfileId(profile: unknown): string {
  const me = asRecord(profile)
  return toId(me.id || me.userId || me.uid || me.studentId || me.sid)
}

function readReceivedLikes(profile: Record<string, unknown>): number {
  const stats = asRecord(profile.stats)
  return Math.max(0, firstNumber(stats.receivedLikes, profile.receivedLikes, stats.likeCount, profile.likeCount) ?? 0)
}

function pickReceivedLikes(feedData: unknown, fallbackLikes: number): number {
  const data = asRecord(feedData)
  const stats = asRecord(data.stats)
  return Math.max(0, firstNumber(data.receivedLikes, data.userReceivedLikes, stats.receivedLikes) ?? fallbackLikes)
}

function hasReceivedLikes(feedData: unknown): boolean {
  const data = asRecord(feedData)
  const stats = asRecord(data.stats)
  return firstNumber(data.receivedLikes, data.userReceivedLikes, stats.receivedLikes) !== null
}

function pickFeedCurrency(feedData: unknown): number | null {
  const data = asRecord(feedData)
  const user = asRecord(data.user || data.me || data.profile)
  const stats = asRecord(data.stats)
  const currency = firstNumber(data.userCurrency, data.currency, data.fishPoints, user.currency, user.userCurrency, stats.fishPoints)
  return currency === null ? null : Math.max(0, currency)
}

function pickFeedCount(feedData: unknown, fallbackFeedCount: number): number {
  const data = asRecord(feedData)
  const stats = asRecord(data.stats)
  return Math.max(0, firstNumber(data.feedCount, data.userFeedCount, stats.feedCount) ?? fallbackFeedCount)
}

function patchMeAfterFeed(
  previous: ApiResult<Record<string, unknown>> | undefined,
  nextCurrency: number | null,
  feedData: unknown,
): ApiResult<Record<string, unknown>> {
  const profile = asRecord(previous?.data)
  const stats = asRecord(profile.stats)
  const previousFeedCount = firstNumber(stats.feedCount, profile.feedCount) ?? 0
  const nextFeedCount = pickFeedCount(feedData, previousFeedCount + 1)

  return {
    code: previous?.code ?? null,
    message: previous?.message ?? '',
    raw: previous?.raw ?? null,
    data: {
      ...profile,
      ...(nextCurrency === null ? {} : { currency: nextCurrency }),
      feedCount: nextFeedCount,
      stats: {
        ...stats,
        feedCount: nextFeedCount,
      },
    },
  }
}

function patchMeReceivedLikes(
  previous: ApiResult<Record<string, unknown>> | undefined,
  delta: number,
  responseData?: unknown,
): ApiResult<Record<string, unknown>> {
  const profile = asRecord(previous?.data)
  const stats = asRecord(profile.stats)
  const previousLikes = readReceivedLikes(profile)
  const nextLikes = pickReceivedLikes(responseData, previousLikes + delta)

  return {
    code: previous?.code ?? null,
    message: previous?.message ?? '',
    raw: previous?.raw ?? null,
    data: {
      ...profile,
      receivedLikes: nextLikes,
      stats: {
        ...stats,
        receivedLikes: nextLikes,
      },
    },
  }
}

function pickMomentLiked(row: Record<string, unknown>): boolean {
  return toOptionalBoolean(row.liked ?? row.isLiked ?? row.hasLiked ?? row.likedByMe ?? row.likeStatus) ?? false
}

function pickMomentLikeCount(row: Record<string, unknown>): number {
  return Math.max(0, firstNumber(row.likeCount, row.likes, row.likesCount, row.thumbUpCount, row.praiseCount) ?? 0)
}

function patchMomentLikeState(items: unknown, momentId: string, liked: boolean, responseData?: unknown): Record<string, unknown>[] {
  const response = asRecord(responseData)
  return asArray<Record<string, unknown>>(items).map((item) => {
    const row = asRecord(item)
    if (toId(row.id || row.postId || row.momentId) !== momentId) return row

    const currentCount = pickMomentLikeCount(row)
    const currentLiked = pickMomentLiked(row)
    const nextLiked = toOptionalBoolean(response.isLiked ?? response.liked ?? response.hasLiked ?? response.likedByMe) ?? liked
    const fallbackCount = currentCount + (nextLiked === currentLiked ? 0 : nextLiked ? 1 : -1)
    const nextCount = Math.max(0, firstNumber(response.likeCount, response.likes, response.likesCount) ?? fallbackCount)

    return {
      ...row,
      liked: nextLiked,
      isLiked: nextLiked,
      likeCount: nextCount,
    }
  })
}

function removeMomentFromState(items: unknown, momentId: string): Record<string, unknown>[] {
  return asArray<Record<string, unknown>>(items).filter((item) => {
    const row = asRecord(item)
    return toId(row.id || row.postId || row.momentId) !== momentId
  })
}

function normalizeMoment(item: unknown, index: number): MomentView {
  const row = asRecord(item)
  const user = asRecord(row.user)
  const media = asArray<string>(row.media)

  return {
    id: toId(row.id || row.postId || row.momentId, String(index + 1)),
    content: asString(row.content, '今天在校园里偶遇这只小可爱，状态不错。'),
    image: asString(media[0], ''),
    userId: toId(user.id || user.userId || row.userId || row.authorId || row.uid),
    userName: asString(user.name || row.userName, '爱它的喵'),
    userAvatar: asString(user.avatar, ''),
    createTime: formatMomentTime(row.createTime || row.createdAt),
    liked: pickMomentLiked(row),
    likeCount: pickMomentLikeCount(row),
  }
}

export function CatDetailPage() {
  usePageTitle('猫咪详情')
  const navigate = useNavigate()
  const location = useLocation()
  const { id = '1' } = useParams()
  const queryClient = useQueryClient()

  const detailQuery = useQuery({
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
      const scoped = await getMoments({ page: 1, pageSize: 20, catId: id })
      let items = toPaged<Record<string, unknown>>(scoped.data).items

      if (!items.length) {
        const all = await getMoments({ page: 1, pageSize: 30 })
        const allItems = toPaged<Record<string, unknown>>(all.data).items
        items = allItems.filter((moment) => {
          const row = asRecord(moment)
          const related = asRecord(row.relatedCats || row.relatedCat || row.cat)
          const relatedId = asString(related.id || row.catId)
          return relatedId === id
        })
      }

      return items
    },
  })

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
  })

  const meCurrency = useMemo(() => {
    return readProfileCurrency(meQuery.data?.data)
  }, [meQuery.data?.data])
  const fishCurrency = Math.max(0, meCurrency)
  const currentUserId = useMemo(() => readProfileId(meQuery.data?.data), [meQuery.data?.data])

  const feedMutation = useMutation({
    mutationFn: async () => requireSuccessfulResult(await feedCat(id), '投喂失败，请稍后重试'),
    onSuccess: async (result) => {
      const userCurrency = pickFeedCurrency(result.data)
      queryClient.setQueryData<ApiResult<Record<string, unknown>> | undefined>(['me'], (previous) =>
        patchMeAfterFeed(previous, userCurrency, result.data),
      )

      Modal.success({
        title: '投喂成功',
        content: userCurrency === null ? undefined : `当前剩余小鱼干：${userCurrency}`,
        okText: '知道了',
      })

      void queryClient.invalidateQueries({ queryKey: ['leaderboard', 'popularity'] })
      void queryClient.invalidateQueries({ queryKey: ['cats', 'home'] })
      void queryClient.invalidateQueries({ queryKey: ['me'] })
      void queryClient.invalidateQueries({ queryKey: ['cat-detail', id] })
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '投喂失败，请稍后重试'),
  })

  const likeMutation = useMutation<ApiResult<Record<string, unknown>>, Error, ToggleMomentLikeVariables, ToggleMomentLikeContext>({
    mutationFn: async ({ moment }) =>
      requireSuccessfulResult(await (moment.liked ? unlikeMoment(moment.id) : likeMoment(moment.id)), '操作失败，请稍后重试'),
    onMutate: async ({ moment }) => {
      const nextLiked = !moment.liked
      const delta = nextLiked ? 1 : -1
      const isOwnMoment = Boolean(currentUserId && moment.userId && currentUserId === moment.userId)

      await queryClient.cancelQueries({ queryKey: ['cat-moments', id] })
      const previousMoments = queryClient.getQueryData<Record<string, unknown>[]>(['cat-moments', id])
      queryClient.setQueryData<Record<string, unknown>[] | undefined>(['cat-moments', id], (previous) =>
        patchMomentLikeState(previous, moment.id, nextLiked),
      )

      const previousMe = queryClient.getQueryData<ApiResult<Record<string, unknown>>>(['me'])
      if (isOwnMoment) {
        await queryClient.cancelQueries({ queryKey: ['me'] })
        queryClient.setQueryData<ApiResult<Record<string, unknown>> | undefined>(['me'], (previous) =>
          patchMeReceivedLikes(previous, delta),
        )
      }

      return { previousMoments, previousMe, isOwnMoment, delta }
    },
    onError: (error, _variables, context) => {
      if (context?.previousMoments) {
        queryClient.setQueryData(['cat-moments', id], context.previousMoments)
      }
      if (context?.isOwnMoment && context.previousMe) {
        queryClient.setQueryData(['me'], context.previousMe)
      }
      message.error(error instanceof Error ? error.message : '操作失败，请稍后重试')
    },
    onSuccess: (result, { moment }, context) => {
      const nextLiked = !moment.liked
      queryClient.setQueryData<Record<string, unknown>[] | undefined>(['cat-moments', id], (previous) =>
        patchMomentLikeState(previous, moment.id, nextLiked, result.data),
      )

      if (context?.isOwnMoment || hasReceivedLikes(result.data)) {
        queryClient.setQueryData<ApiResult<Record<string, unknown>> | undefined>(['me'], (previous) =>
          patchMeReceivedLikes(previous, 0, result.data),
        )
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['cat-moments', id], refetchType: 'none' })
      void queryClient.invalidateQueries({ queryKey: ['moments'], refetchType: 'none' })
      void queryClient.invalidateQueries({ queryKey: ['me'], refetchType: 'none' })
    },
  })

  const deleteMomentMutation = useMutation<ApiResult<Record<string, unknown>>, Error, DeleteMomentVariables>({
    mutationFn: async ({ moment }) => requireSuccessfulResult(await deleteMoment(moment.id), '删除失败，请稍后重试'),
    onSuccess: (_result, { moment }) => {
      queryClient.setQueryData<Record<string, unknown>[] | undefined>(['cat-moments', id], (previous) =>
        removeMomentFromState(previous, moment.id),
      )
      Modal.success({
        title: '删除动态成功',
        content: '该动态已从猫咪详情页移除',
        okText: '知道了',
      })
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : '删除失败，请稍后重试')
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['cat-moments', id], refetchType: 'none' })
      void queryClient.invalidateQueries({ queryKey: ['moments'], refetchType: 'none' })
    },
  })

  const detail = detailQuery.data?.data
  const basicInfo = detail?.basicInfo
  const attributes = detail?.attributes
  const catName = detail?.name ?? '猫咪'
  const stateCat = asRecord(asRecord(location.state).cat)
  const stateAvatar = asString(stateCat.avatar)

  const heroImage = useMemo(() => {
    const images = detail?.images ?? []
    return stateAvatar || detail?.avatar || images[0] || ''
  }, [detail?.avatar, detail?.images, stateAvatar])

  const statusText = basicInfo?.status || '在校'
  const roleText = normalizeDynamicTypeLabel(basicInfo?.role, roleOptions, normalizeRoleText(basicInfo?.role))
  const hauntLocationText = normalizeDynamicTypeLabel(basicInfo?.hauntLocation, locationOptions, normalizeLocationText(basicInfo?.hauntLocation))
  const locationText = [basicInfo?.campus, hauntLocationText].filter(Boolean).join(' · ') || '未知地点'
  const neuteredInfo = basicInfo?.neutered?.isNeutered ? '已绝育' : '未绝育'
  const descriptionText = detail?.description || '暂无档案描述'

  const friendliness = toTenScale(attributes?.friendliness)
  const gluttony = toTenScale(attributes?.gluttony)
  const fight = toTenScale(attributes?.fight)
  const appearance = toTenScale(attributes?.appearance)

  const metricItems = [
    { label: '亲人指数', value: friendliness, color: '#f87171' },
    { label: '贪吃指数', value: gluttony, color: '#facc15' },
    { label: '战斗力', value: fight, color: '#60a5fa' },
    { label: '颜值', value: appearance, color: '#9ca3af' },
  ]

  const moments = useMemo(() => asArray<Record<string, unknown>>(momentsQuery.data).map(normalizeMoment), [momentsQuery.data])
  const pendingLikeMomentId = likeMutation.isPending ? likeMutation.variables?.moment.id : null
  const pendingDeleteMomentId = deleteMomentMutation.isPending ? deleteMomentMutation.variables?.moment.id : null

  return (
    <div className="pb-[110px]">
      <div className="relative h-[320px] overflow-hidden bg-gradient-to-br from-[#9ea7b7] to-[#667084]">
        {heroImage ? <img alt={catName} className="h-full w-full object-cover" src={heroImage} /> : null}
        <button
          className="absolute left-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/20 text-white backdrop-blur"
          type="button"
          onClick={() => navigate(-1)}
        >
          <ArrowLeftOutlined />
        </button>
      </div>

      <QueryState error={detailQuery.error} isLoading={detailQuery.isLoading}>
        <div className="relative z-20 -mt-24 px-5">
          <section className="rounded-[22px] bg-white p-4 shadow-[0_10px_24px_rgba(0,0,0,0.08)]">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5e9] px-3 py-1 text-[12px] font-semibold text-[#2e7d32]">
                  <HomeOutlined />
                  {statusText}（{roleText}）
                </span>
                <h1 className="mt-2 text-[28px] font-extrabold text-[#1a1a1a]">
                  {catName}
                  <HeartFilled className="ml-2 text-[16px] text-[#ff8a80]" />
                </h1>
                <p className="mt-1 text-[12px] text-[#999]">{neuteredInfo}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff8e1] text-[22px]">🐱</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-[#f8f9fa] p-3">
                <p className="text-[10px] text-[#999]">角色 / 编制</p>
                <p className="mt-1 text-[14px] font-bold text-[#333]">{roleText}</p>
              </div>
              <div className="rounded-2xl bg-[#f8f9fa] p-3">
                <p className="text-[10px] text-[#999]">常驻据点</p>
                <p className="mt-1 text-[14px] font-bold text-[#333]">{hauntLocationText || '未知'}</p>
              </div>
            </div>

            <div className="mt-4 border-t border-[#eee] pt-4">
              <h3 className="mb-3 text-[14px] font-bold">档案属性</h3>
              {metricItems.map((item) => (
                <div key={item.label} className="mb-2.5">
                  <div className="mb-1 flex items-center justify-between text-[12px] text-[#555]">
                    <span>{item.label}</span>
                    <span>{item.value.toFixed(1)}</span>
                  </div>
                  <Progress percent={toPercentFromTen(item.value)} showInfo={false} size={[0, 8]} strokeColor={item.color} />
                </div>
              ))}
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#ffccd2] bg-[#ffebee] px-3 py-2 text-[12px] font-semibold text-[#c62828]">
                <ExclamationCircleFilled />
                高能提醒：{descriptionText}
              </div>
            </div>
          </section>
        </div>

        <div className="mt-4 px-5">
          <section className="rounded-[18px] bg-white p-4 shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
            <h3 className="mb-3 text-[16px] font-bold">喵喵动态</h3>
            {moments.length ? (
              <div className="space-y-3 border-l-2 border-[#eee] pl-4">
                {moments.slice(0, 3).map((item) => {
                  const isOwnMoment = Boolean(currentUserId && item.userId && currentUserId === item.userId)

                  return (
                    <div key={item.id} className="relative rounded-[14px] bg-[#f8fafc] p-3">
                      <span className="absolute -left-[22px] top-3 h-3 w-3 rounded-full border-2 border-white bg-[#ffd54f]" />
                      <div className="absolute right-3 top-3 flex items-center gap-1.5">
                        {isOwnMoment ? (
                          <button
                            aria-label="删除动态"
                            className="flex h-8 w-8 items-center justify-center rounded-full border border-[#fee2e2] bg-white text-[15px] text-[#dc2626] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(220,38,38,0.18)] disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={pendingDeleteMomentId === item.id}
                            title="删除动态"
                            type="button"
                            onClick={() => deleteMomentMutation.mutate({ moment: item })}
                          >
                            <DeleteOutlined />
                          </button>
                        ) : null}
                        <button
                          aria-label={item.liked ? '取消点赞' : '点赞'}
                          className={[
                            'flex h-8 min-w-[32px] items-center justify-center gap-1 rounded-full border px-2 text-[13px] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_8px_18px_rgba(15,23,42,0.18)] disabled:cursor-not-allowed disabled:opacity-60',
                            item.liked ? 'border-[#111827] bg-[#111827] text-white' : 'border-[#e5e7eb] bg-white text-[#111827]',
                          ].join(' ')}
                          disabled={pendingLikeMomentId === item.id}
                          title={item.liked ? '取消点赞' : '点赞'}
                          type="button"
                          onClick={() => likeMutation.mutate({ moment: item })}
                        >
                          {item.liked ? <LikeFilled /> : <LikeOutlined />}
                          <span className="text-[11px] font-semibold tabular-nums leading-none">{item.likeCount}</span>
                        </button>
                      </div>
                      <div className="mb-2 flex items-center gap-2 pr-28">
                        <div className="h-8 w-8 overflow-hidden rounded-full bg-gradient-to-br from-[#d1d5db] to-[#94a3b8]">
                          {item.userAvatar ? <img alt={item.userName} className="h-full w-full object-cover" src={item.userAvatar} /> : null}
                        </div>
                        <div>
                          <p className="text-[12px] font-semibold">{item.userName}</p>
                          <p className="text-[10px] text-[#999]">{item.createTime}</p>
                        </div>
                      </div>
                      <p className="text-[13px] leading-5 text-[#333]">{item.content}</p>
                      {item.image ? <img alt="动态图片" className="mt-3 h-28 w-full rounded-lg object-cover" src={item.image} /> : null}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="rounded-[14px] bg-[#f8fafc] p-3 text-[12px] text-[#64748b]">暂无相关动态</div>
            )}
          </section>
        </div>
      </QueryState>

      <div className="fixed bottom-[86px] left-1/2 z-40 flex w-[min(350px,calc(100%-24px))] -translate-x-1/2 gap-2 rounded-[20px] bg-white px-3 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.15)]">
        <Link className="flex flex-1 items-center justify-center gap-1 rounded-full bg-[#fff3e0] py-2 text-[13px] font-semibold text-[#ef6c00]" to={`/user/publish?catId=${id}`}>
          <CameraOutlined />
          发动态
        </Link>
        <Button
          block
          className="!h-[38px] !flex-[1.4] !rounded-full !border-none !bg-[#ffd54f] !text-[13px] !font-semibold !text-[#1a1a1a]"
          icon={<GiftOutlined />}
          loading={feedMutation.isPending}
          onClick={() => feedMutation.mutate()}
          type="primary"
        >
          {`投喂 (${fishCurrency})`}
        </Button>
      </div>

      <p className="mt-4 flex items-center justify-center gap-1 text-[11px] text-[#999]">
        <EnvironmentOutlined />
        {locationText}
      </p>
    </div>
  )
}
