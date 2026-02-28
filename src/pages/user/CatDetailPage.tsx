import {
  ArrowLeftOutlined,
  CameraOutlined,
  EnvironmentOutlined,
  ExclamationCircleFilled,
  GiftOutlined,
  HeartFilled,
  HomeOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Modal, Progress, message } from 'antd'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { feedCat, getCatDetail } from '@/api/endpoints/cats'
import { getMoments } from '@/api/endpoints/moments'
import { getMe } from '@/api/endpoints/user'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asArray, asNumber, asRecord, asString, toPaged } from '@/utils/format'

type MomentView = {
  id: string
  content: string
  image: string
  userName: string
  userAvatar: string
  createTime: string
}

function toYmd(value?: string): string {
  if (!value) return '未知'
  return value.slice(0, 10)
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

function normalizeMoment(item: unknown, index: number): MomentView {
  const row = asRecord(item)
  const user = asRecord(row.user)
  const media = asArray<string>(row.media)

  return {
    id: asString(row.id, String(index + 1)),
    content: asString(row.content, '今天在校园里偶遇这只小可爱，状态不错。'),
    image: asString(media[0], ''),
    userName: asString(user.name || row.userName, '爱它的喵'),
    userAvatar: asString(user.avatar, ''),
    createTime: formatMomentTime(row.createTime || row.createdAt),
  }
}

export function CatDetailPage() {
  usePageTitle('猫咪详情')
  const navigate = useNavigate()
  const { id = '1' } = useParams()
  const queryClient = useQueryClient()

  const detailQuery = useQuery({
    queryKey: ['cat-detail', id],
    queryFn: () => getCatDetail(id),
  })

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

  const [fedCurrency, setFedCurrency] = useState<number | null>(null)
  const meCurrency = useMemo(() => {
    const me = asRecord(meQuery.data?.data)
    const currencyNumber = asNumber(me.currency, Number.NaN)
    if (Number.isFinite(currencyNumber)) {
      return Math.max(0, currencyNumber)
    }

    const currencyText = asString(me.currency).trim()
    if (!currencyText) {
      return 0
    }

    const parsed = Number(currencyText)
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0
  }, [meQuery.data?.data])
  const fishCurrency = Math.max(0, fedCurrency ?? meCurrency)

  const feedMutation = useMutation({
    mutationFn: () => feedCat(id),
    onSuccess: (result) => {
      const userCurrency = asNumber(asRecord(result.data).userCurrency, -1)
      if (userCurrency >= 0) {
        setFedCurrency(userCurrency)
      }

      Modal.success({
        title: '投喂成功',
        content: userCurrency >= 0 ? `当前剩余小鱼干：${userCurrency}` : undefined,
        okText: '知道了',
      })

      void queryClient.invalidateQueries({ queryKey: ['leaderboard', 'popularity'] })
      void queryClient.invalidateQueries({ queryKey: ['cats', 'home'] })
      void queryClient.invalidateQueries({ queryKey: ['me'] })
      void queryClient.invalidateQueries({ queryKey: ['cat-detail', id] })
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '投喂失败，请稍后重试'),
  })

  const detail = detailQuery.data?.data
  const basicInfo = detail?.basicInfo
  const attributes = detail?.attributes
  const catName = detail?.name ?? '猫咪'

  const heroImage = useMemo(() => {
    const images = detail?.images ?? []
    return images[0] || detail?.avatar || ''
  }, [detail?.avatar, detail?.images])

  const statusText = basicInfo?.status || '在校'
  const roleText = basicInfo?.role || '流浪游侠'
  const locationText = [basicInfo?.campus, basicInfo?.hauntLocation].filter(Boolean).join(' · ') || '未知地点'
  const neuteredInfo = basicInfo?.neutered?.isNeutered ? `已绝育（${toYmd(basicInfo?.neutered?.neuteredDate)}）` : '未绝育'
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
                <p className="mt-1 text-[14px] font-bold text-[#333]">{basicInfo?.hauntLocation || '未知'}</p>
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
                {moments.slice(0, 3).map((item) => (
                  <div key={item.id} className="relative rounded-[14px] bg-[#f8fafc] p-3">
                    <span className="absolute -left-[22px] top-3 h-3 w-3 rounded-full border-2 border-white bg-[#ffd54f]" />
                    <div className="mb-2 flex items-center gap-2">
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
                ))}
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
