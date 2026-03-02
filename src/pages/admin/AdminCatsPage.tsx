import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Input } from 'antd'
import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { ApiError, ApiNotFoundError } from '@/api/adapters/errors'
import { getCats } from '@/api/endpoints/cats'
import { ApiUnavailable } from '@/components/feedback/ApiUnavailable'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asArray, asRecord, asString, toPaged } from '@/utils/format'
import { normalizeMediaUrl } from '@/utils/media'

type CatStatus = '在校' | '待领养' | '已领养' | '已毕业' | '治疗中' | '喵星'
type CatFilter = '全部' | '待领养' | '在校' | '已领养' | '已毕业'

type CatItem = {
  id: string
  name: string
  avatar: string
  status: CatStatus
  color: string
  campus: string
  location: string
  meta: string
  tags: string[]
}

const filters: CatFilter[] = ['全部', '待领养', '在校', '已领养', '已毕业']

const fallbackCats: CatItem[] = [
  {
    id: '1',
    name: '少女',
    avatar: 'https://loremflickr.com/240/180/cat?lock=21',
    status: '待领养',
    color: '玳瑁',
    campus: '仁园',
    location: '食堂',
    meta: '玳瑁 · 仁园',
    tags: ['待领养', '亲人'],
  },
  {
    id: '2',
    name: 'Ctrl',
    avatar: 'https://loremflickr.com/240/180/cat?lock=22',
    status: '在校',
    color: '狸花',
    campus: '软件园',
    location: '校门',
    meta: '狸花 · 软件园',
    tags: ['在校', '软萌'],
  },
  {
    id: '3',
    name: '麻薯',
    avatar: 'https://loremflickr.com/240/180/cat?lock=23',
    status: '已毕业',
    color: '三花',
    campus: '软件园',
    location: '东门',
    meta: '三花 · 软件园',
    tags: ['已领养', '吃货'],
  },
  {
    id: '4',
    name: '大橘座',
    avatar: 'https://loremflickr.com/240/180/cat?lock=24',
    status: '在校',
    color: '橘猫',
    campus: '中心校区',
    location: '林荫道',
    meta: '橘猫 · 中心校区',
    tags: ['在校', '霸主'],
  },
  {
    id: '5',
    name: '蛋奶',
    avatar: 'https://loremflickr.com/240/180/cat?lock=25',
    status: '在校',
    color: '奶牛',
    campus: '图书馆',
    location: '中庭',
    meta: '奶牛 · 图书馆',
    tags: ['在校', '安静'],
  },
  {
    id: '6',
    name: '小黑',
    avatar: 'https://loremflickr.com/240/180/cat?lock=26',
    status: '待领养',
    color: '纯黑',
    campus: '软件园',
    location: '草坪',
    meta: '纯黑 · 软件园',
    tags: ['待领养', '高冷'],
  },
]

const statusStyle: Record<CatStatus, string> = {
  在校: 'bg-[#ecfdf3] text-[#2e7d32]',
  待领养: 'bg-[#ffebee] text-[#d32f2f]',
  已领养: 'bg-[#e8f5e9] text-[#2e7d32]',
  已毕业: 'bg-[#eff6ff] text-[#1565c0]',
  治疗中: 'bg-[#fff7ed] text-[#f57c00]',
  喵星: 'bg-[#fff8e1] text-[#ffa000]',
}

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

const campusEnumToLabelMap: Record<string, string> = {
  CENTRAL: '中心校区',
  BAOTUQUAN: '趵突泉校区',
  HONGJIALOU: '洪家楼校区',
  QIANFOSHAN: '千佛山校区',
  XINGLONGSHAN: '兴隆山校区',
  SOFTWARE_PARK: '软件园校区',
  QINGDAO: '青岛校区',
  WEIHAI: '威海校区',
}

function normalizeCampus(rawCampus: unknown): string {
  const campus = asString(rawCampus).trim()
  if (!campus) return ''
  if (campus in campusCodeToLabelMap) return campusCodeToLabelMap[campus]
  const enumCampus = campus.toUpperCase()
  if (enumCampus in campusEnumToLabelMap) return campusEnumToLabelMap[enumCampus]
  return campus
}

function normalizeStatus(rawStatus: unknown): CatStatus {
  const status = asString(rawStatus).trim().toUpperCase()
  if (!status) return '在校'
  if (status.includes('待领养') || status.includes('PENDING') || status.includes('WAIT')) return '待领养'
  if (status.includes('治疗') || status.includes('TREAT') || status.includes('HOSPITAL')) return '治疗中'
  if (status.includes('喵星') || status.includes('MEOW') || status.includes('STAR')) return '喵星'
  if (status.includes('毕业') || status.includes('GRADUATE')) return '已毕业'
  if (status.includes('领养') || status.includes('ADOPTED')) return '已领养'
  if (status.includes('在校') || status.includes('SCHOOL') || status.includes('CAMPUS')) return '在校'
  return '在校'
}

function normalizeCats(payload: unknown): CatItem[] {
  const rawItems = toPaged<Record<string, unknown>>(payload).items

  return rawItems.map((item, index) => {
    const row = asRecord(item)
    const basicInfo = asRecord(row.basicInfo)
    const status = normalizeStatus(row.status || basicInfo.status)
    const color = asString(row.color || basicInfo.color, '未知花色')
    const campus = normalizeCampus(row.campus || basicInfo.campus)
    const location = asString(row.locationName || row.location || basicInfo.hauntLocation, campus || '未知地点')
    const meta = [color, campus || location].filter(Boolean).join(' · ')

    return {
      id: asString(row.id, String(index + 1)),
      name: asString(row.name, `猫咪${index + 1}`),
      avatar: normalizeMediaUrl(row.avatar || row.image),
      status,
      color,
      campus,
      location,
      meta,
      tags: asArray<string>(row.tags),
    }
  })
}

type CatCoverProps = {
  src: string
  alt: string
}

function CatCover({ src, alt }: CatCoverProps) {
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setHasError(false)
  }, [src])

  if (!src || hasError) return null

  return <img alt={alt} className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" src={src} onError={() => setHasError(true)} />
}

function isRecoverableAdminCatsError(error: unknown): boolean {
  if (error instanceof ApiNotFoundError) return true
  return error instanceof ApiError && error.shape.httpStatus !== null && error.shape.httpStatus >= 500
}

export function AdminCatsPage() {
  usePageTitle('猫咪档案管理')
  const [activeFilter, setActiveFilter] = useState<CatFilter>('全部')
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')

  const query = useQuery({
    queryKey: ['admin-cats', 'list'],
    queryFn: () =>
      getCats({
        page: 1,
        pageSize: 120,
      }),
  })

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setKeyword(keywordInput.trim().toLowerCase())
    }, 250)
    return () => window.clearTimeout(timer)
  }, [keywordInput])

  const cats = useMemo(() => {
    const normalized = normalizeCats(query.data?.data)
    if (normalized.length > 0) return normalized
    if (isRecoverableAdminCatsError(query.error)) return fallbackCats
    return normalized
  }, [query.data?.data, query.error])

  const filteredCats = useMemo(() => {
    const byFilter = activeFilter === '全部' ? cats : cats.filter((cat) => cat.status === activeFilter)
    if (!keyword) return byFilter

    return byFilter.filter((cat) =>
      [cat.name, cat.meta, cat.campus, cat.location, cat.status, ...cat.tags].join(' ').toLowerCase().includes(keyword),
    )
  }, [activeFilter, cats, keyword])

  return (
    <div className="pb-8">
      <section className="mb-5 rounded-b-[24px] bg-white px-5 pb-5 pt-5 shadow-[0_2px_15px_rgba(0,0,0,0.04)]">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-[22px] font-bold text-[#2c3e50]">猫咪档案管理</h1>
          <Link
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ffd54f] text-[#5d4037] shadow-[0_4px_10px_rgba(255,213,79,0.4)]"
            to="/admin/cats/new/edit"
          >
            <PlusOutlined />
          </Link>
        </div>

        <Input
          className="!h-12 !rounded-2xl !border-none !bg-[#f5f5f5]"
          placeholder="搜索猫咪名字、花色或地点..."
          prefix={<SearchOutlined className="text-[#bdc3c7]" />}
          value={keywordInput}
          onChange={(event) => setKeywordInput(event.target.value)}
        />
      </section>

      <div className="h5-content pt-0">
        <div className="chip-row mb-4">
          {filters.map((item) => (
            <button
              key={item}
              className={clsx(
                'whitespace-nowrap rounded-full border px-4 py-2 text-[13px] transition',
                activeFilter === item
                  ? 'border-transparent bg-[#ffd54f] font-semibold text-[#5d4037] shadow-[0_4px_10px_rgba(255,213,79,0.3)]'
                  : 'border-black/[0.05] bg-white text-[#7f8c8d]',
              )}
              onClick={() => setActiveFilter(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>

        <QueryState
          error={isRecoverableAdminCatsError(query.error) ? null : query.error}
          isEmpty={!query.isLoading && !query.error && filteredCats.length === 0}
          isLoading={query.isLoading}
          emptyDescription="暂无猫咪档案"
        >
          <div className="grid grid-cols-2 gap-3">
            {filteredCats.map((cat) => (
              <article
                key={cat.id}
                className="overflow-hidden rounded-[20px] border border-black/[0.03] bg-white shadow-[0_8px_20px_rgba(0,0,0,0.04)]"
              >
                <div className="relative h-32 bg-gradient-to-br from-[#d1d5db] to-[#94a3b8]">
                  <CatCover alt={cat.name} src={cat.avatar} />
                  <span
                    className={clsx(
                      'absolute right-2 top-2 rounded-xl px-2 py-1 text-[10px] font-bold',
                      statusStyle[cat.status],
                    )}
                  >
                    {cat.status}
                  </span>
                </div>

                <div className="p-3">
                  <h3 className="mb-1 text-[15px] font-bold text-[#2c3e50]">{cat.name}</h3>
                  <p className="mb-2 text-[11px] text-[#7f8c8d]">{cat.meta}</p>

                  <div className="mb-3 flex flex-wrap gap-1">
                    {(cat.tags.length > 0 ? cat.tags : [cat.status]).slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className={clsx(
                          'rounded-lg px-2 py-0.5 text-[10px] font-semibold',
                          tag.includes('待领养') && 'bg-[#ffebee] text-[#d32f2f]',
                          (tag.includes('在校') || tag.includes('已领养')) && 'bg-[#e8f5e9] text-[#2e7d32]',
                          tag.includes('毕业') && 'bg-[#eff6ff] text-[#1565c0]',
                          !tag.includes('待领养') &&
                            !tag.includes('在校') &&
                            !tag.includes('已领养') &&
                            !tag.includes('毕业') &&
                            'bg-[#f1f5f9] text-[#475569]',
                        )}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      className="rounded-lg bg-[#fff8e1] py-1.5 text-center text-[12px] font-semibold text-[#ffa000]"
                      state={{ cat }}
                      to={`/admin/cats/${cat.id}/edit`}
                    >
                      编辑
                    </Link>
                    <Link
                      className="rounded-lg bg-[#f5f5f5] py-1.5 text-center text-[12px] font-semibold text-[#7f8c8d]"
                      to={`/admin/cats/${cat.id}`}
                    >
                      详情
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </QueryState>

        {isRecoverableAdminCatsError(query.error) ? (
          <div className="mt-4">
            <ApiUnavailable onRetry={() => query.refetch()} title="猫咪管理接口暂不可用，当前展示设计稿态" />
          </div>
        ) : null}
      </div>

      <Link
        className="fixed bottom-24 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-[#ffd54f] text-[24px] text-[#5d4037] shadow-[0_8px_25px_rgba(255,213,79,0.5)]"
        to="/admin/cats/new/edit"
      >
        <PlusOutlined />
      </Link>
    </div>
  )
}
