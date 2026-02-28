import {
  AlertFilled,
  BookOutlined,
  EnvironmentFilled,
  EnvironmentOutlined,
  FireFilled,
  RightOutlined,
  SearchOutlined,
  TrophyFilled,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Input, Tag } from 'antd'
import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { getCats } from '@/api/endpoints/cats'
import { QueryState } from '@/components/feedback/QueryState'
import { useCampus } from '@/hooks/useCampus'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asArray, asNumber, asRecord, asString, toPaged } from '@/utils/format'

type CatCardItem = {
  id: string
  name: string
  avatar: string
  color: string
  campus: string
  location: string
  status: string
  tags: string[]
  popularity: number
  isNeutered: boolean
}

const campusOptions: Array<{ label: string; value: string; code: string }> = [
  { label: '济南中心校区', value: 'CENTRAL', code: '0' },
  { label: '趵突泉校区', value: 'BAOTUQUAN', code: '1' },
  { label: '洪家楼校区', value: 'HONGJIALOU', code: '2' },
  { label: '千佛山校区', value: 'QIANFOSHAN', code: '3' },
  { label: '兴隆山校区', value: 'XINGLONGSHAN', code: '4' },
  { label: '软件园校区', value: 'SOFTWARE_PARK', code: '5' },
  { label: '青岛校区', value: 'QINGDAO', code: '6' },
  { label: '威海校区', value: 'WEIHAI', code: '7' },
]

const colorFilters: Array<{ label: string; value: string }> = [
  { label: '全部', value: '' },
  { label: '橘猫', value: '橘猫' },
  { label: '狸花', value: '狸花' },
  { label: '奶牛', value: '奶牛' },
  { label: '三花', value: '三花' },
  { label: '玳瑁', value: '玳瑁' },
  { label: '纯白', value: '纯白' },
  { label: '纯黑', value: '纯黑' },
  { label: '其他', value: '其他' },
]

const statusClassMap: Record<string, string> = {
  在校: 'bg-[#ecfdf3] text-[#166534]',
  毕业: 'bg-[#eff6ff] text-[#1d4ed8]',
  喵星: 'bg-[#fef2f2] text-[#b91c1c]',
  住院: 'bg-[#fff7ed] text-[#c2410c]',
}

function normalizeCampusLabel(rawCampus: unknown): string {
  const campus = asString(rawCampus).trim()
  if (!campus) return '未知校区'
  const matched = campusOptions.find((item) => item.value === campus || item.code === campus)
  return matched?.label ?? campus
}

function normalizeCatList(payload: unknown): CatCardItem[] {
  const items = toPaged<Record<string, unknown>>(payload).items

  return items.map((cat, index) => {
    const row = asRecord(cat)
    const tags = asArray<string>(row.tags).filter(Boolean)

    return {
      id: asString(row.id, String(index + 1)),
      name: asString(row.name, `猫咪${index + 1}`),
      avatar: asString(row.avatar, ''),
      color: asString(row.color, '未知花色'),
      campus: normalizeCampusLabel(row.campus),
      location: asString(row.locationName || row.location || row.hauntLocation, '未知地点'),
      status: asString(row.status, '未知状态'),
      tags,
      popularity: asNumber(row.popularity, 0),
      isNeutered: row.isNeutered === true,
    }
  })
}

function getCampusCode(campusValue: string): string {
  const campus = campusOptions.find((item) => item.value === campusValue)
  return campus?.code ?? '5'
}

function pickStarCat(cats: CatCardItem[]): CatCardItem | null {
  if (!cats.length) return null
  return [...cats].sort((a, b) => b.popularity - a.popularity)[0]
}

export function HomePage() {
  usePageTitle('首页')
  const { campus, setCampus } = useCampus()
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [activeColor, setActiveColor] = useState('')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setKeyword(keywordInput.trim())
    }, 250)
    return () => window.clearTimeout(timer)
  }, [keywordInput])

  const campusCode = getCampusCode(campus)

  const catsQuery = useQuery({
    queryKey: ['cats', 'home', campusCode, keyword, activeColor],
    queryFn: () =>
      getCats({
        campus: campusCode,
        page: 1,
        pageSize: 80,
        search: keyword || undefined,
        color: activeColor || undefined,
      }),
  })

  const statsQuery = useQuery({
    queryKey: ['cats', 'home', 'stats', campusCode],
    queryFn: () =>
      getCats({
        campus: campusCode,
        page: 1,
        pageSize: 200,
      }),
  })

  const list = useMemo(() => normalizeCatList(catsQuery.data?.data), [catsQuery.data?.data])
  const allInCampus = useMemo(() => normalizeCatList(statsQuery.data?.data), [statsQuery.data?.data])

  const starCat = useMemo(() => pickStarCat(allInCampus.length ? allInCampus : list), [allInCampus, list])

  const stats = useMemo(() => {
    const source = allInCampus.length ? allInCampus : list
    const total = asNumber(asRecord(statsQuery.data?.data).total, source.length)
    const campusLiving = source.filter((item) => item.status === '在校').length
    const pendingAdopt = source.filter((item) => item.status.includes('待领养')).length
    const graduated = source.filter((item) => item.status.includes('毕业')).length
    const meowStar = source.filter((item) => item.status.includes('喵星')).length
    const neuteredCount = source.filter((item) => item.isNeutered).length

    return {
      total,
      campusLiving,
      pendingAdopt,
      graduated,
      meowStar,
      neuteredCount,
    }
  }, [allInCampus, list, statsQuery.data?.data])

  const campusLabel = campusOptions.find((item) => item.value === campus)?.label ?? '软件园校区'

  return (
    <div className="h5-content pb-3">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] text-[#9e9e9e]">当前位置</p>
          <div className="mt-1 flex items-center gap-1.5 text-[16px] font-bold text-[#1a1a1a]">
            <EnvironmentFilled className="text-[14px] text-[#4caf50]" />
            <select
              className="max-w-[165px] bg-transparent pr-1 text-[15px] font-bold outline-none"
              value={campus}
              onChange={(event) => setCampus(event.target.value)}
            >
              {campusOptions.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-20 -mx-5 bg-[#f8f6f4] px-5 pb-4">
        <Input
          allowClear
          className="!h-[44px] !rounded-full !border-none !bg-white"
          placeholder="搜索猫咪花名、花色或地点..."
          prefix={<SearchOutlined className="text-slate-400" />}
          value={keywordInput}
          onChange={(event) => setKeywordInput(event.target.value)}
        />
      </div>

      <section className="mb-5 overflow-hidden rounded-[24px] bg-gradient-to-r from-[#bbfec6] via-[#7bf3f3] to-[#4de6f5] pt-4 shadow-[0_10px_25px_rgba(77,230,245,0.3)]">
        <div className="grid grid-cols-5 gap-1 px-2 text-center text-[#1a1a1a]">
          {[
            [stats.total, '猫咪总数'],
            [stats.campusLiving, '留园观察'],
            [stats.pendingAdopt, '待领养'],
            [stats.graduated, '已领养'],
            [stats.meowStar, '喵星'],
          ].map(([num, label]) => (
            <div key={String(label)}>
              <p className="text-[24px] font-extrabold leading-none">{num}</p>
              <p className="mt-1 text-[11px] font-semibold text-[#334155]">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center rounded-tr-[42px] bg-white/30 px-4 py-3 text-[14px] font-semibold text-[#111] backdrop-blur-sm">
          当前已绝育
          <span className="mx-1 text-[22px] font-extrabold">{stats.neuteredCount}</span>
          只流浪喵
          <span className="ml-2 text-[12px] text-[#0f766e]">{campusLabel}</span>
        </div>
      </section>

      <section className="mb-5 grid grid-cols-[1.08fr_1fr] gap-3">
        <Link className="relative overflow-hidden rounded-[22px] bg-[#ffe7ab] p-4 shadow-[0_8px_16px_rgba(0,0,0,0.05)]" to="/user/leaderboard">
          <p className="text-[18px] font-bold text-[#5d4037]">封神榜</p>
          <p className="mt-1 text-[12px] text-[#8d6e63]">谁是校园 No.1？</p>
          <div className="absolute bottom-3 right-3 flex h-7 w-7 items-center justify-center rounded-full bg-white/75 text-[#a77712]">
            <RightOutlined />
          </div>
          <TrophyFilled className="absolute right-3 top-3 text-[30px] text-[#e0ae24]/60" />
        </Link>

        <div className="grid gap-3">
          <Link className="rounded-[18px] bg-[#d9f3dc] p-3 shadow-[0_8px_16px_rgba(0,0,0,0.04)]" to="/user/kepu">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[15px] font-bold text-[#2e7d32]">养猫科普</p>
              <BookOutlined className="text-[20px] text-[#2e7d32]/50" />
            </div>
            <p className="text-[12px] text-[#4f8d59]">科学喂养指南</p>
          </Link>

          <Link className="rounded-[18px] bg-[#ffd9dd] p-3 shadow-[0_8px_16px_rgba(0,0,0,0.04)]" to="/user/sos/report">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-[15px] font-bold text-[#c62828]">紧急 SOS</p>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/65 text-[#c62828]">
                <AlertFilled />
              </div>
            </div>
            <p className="text-[12px] text-[#d94a5a]">伤病快速上报</p>
          </Link>
        </div>
      </section>

      <div className="mb-3 flex items-center justify-between">
        <h2 className="section-title">每日之星</h2>
      </div>

      {starCat ? (
        <Link className="mb-6 flex items-center justify-between overflow-hidden rounded-[22px] bg-white px-4 py-4 shadow-[0_10px_24px_rgba(0,0,0,0.08)]" to={`/user/cats/${starCat.id}`}>
          <div className="w-[58%]">
            <div className="inline-flex items-center gap-1 rounded-full bg-[#f5f5f5] px-3 py-1 text-[11px] font-semibold text-[#666]">
              <FireFilled className="text-[#ffb300]" />
              人气 TOP 1
            </div>
            <p className="mt-3 text-[20px] font-bold text-[#1a1a1a]">{starCat.name}</p>
            <div className="mt-2 h-[8px] overflow-hidden rounded-full bg-[#f1f1f1]">
              <div className="h-full rounded-full bg-gradient-to-r from-[#ffd54f] to-[#ffb300]" style={{ width: `${Math.min(100, Math.max(8, starCat.popularity || 8))}%` }} />
            </div>
            <p className="mt-1 text-[11px] text-[#999]">
              {starCat.color} · {starCat.campus}
            </p>
          </div>
          <div className="relative h-[108px] w-[108px] overflow-hidden rounded-[24px] bg-gradient-to-br from-[#e2e8f0] to-[#94a3b8]">
            {starCat.avatar ? <img alt={starCat.name} className="h-full w-full object-cover" src={starCat.avatar} /> : null}
          </div>
        </Link>
      ) : null}

      <div className="mb-3 flex items-end justify-between">
        <h2 className="section-title">全校图鉴</h2>
        <span className="text-[12px] text-[#999]">查看全部</span>
      </div>

      <div className="chip-row mb-4">
        {colorFilters.map((chip) => (
          <button
            key={chip.label}
            className={clsx('chip-item', activeColor === chip.value && 'chip-item-active')}
            type="button"
            onClick={() => setActiveColor(chip.value)}
          >
            {chip.label}
          </button>
        ))}
      </div>

      <QueryState
        error={catsQuery.error}
        isEmpty={!catsQuery.isLoading && !catsQuery.error && list.length === 0}
        isLoading={catsQuery.isLoading}
        emptyDescription="暂无猫咪数据"
      >
        <div className="grid grid-cols-2 gap-3">
          {list.map((item, index) => (
            <Link key={item.id || String(index)} className="overflow-hidden rounded-[18px] bg-white shadow-[0_8px_18px_rgba(0,0,0,0.06)]" to={`/user/cats/${item.id}`}>
              <div className="relative h-40 bg-gradient-to-br from-[#d1d5db] to-[#94a3b8]">
                {item.avatar ? <img alt={item.name} className="h-full w-full object-cover" src={item.avatar} /> : null}
                <span
                  className={clsx(
                    'absolute right-2 top-2 rounded px-1.5 py-0.5 text-[10px] font-semibold',
                    statusClassMap[item.status] ?? 'bg-black/60 text-white',
                  )}
                >
                  {item.status}
                </span>
              </div>
              <div className="px-3 pb-3 pt-2.5">
                <p className="text-[15px] font-bold text-[#1f2937]">{item.name}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {(item.tags.length ? item.tags : [item.color]).slice(0, 2).map((tag) => (
                    <Tag key={tag} className="!mr-0 !rounded-md !px-1.5 !py-0 !text-[10px]">
                      {tag}
                    </Tag>
                  ))}
                </div>
                <p className="mt-1.5 flex items-center gap-1 text-[10px] text-[#9ca3af]">
                  <EnvironmentOutlined />
                  {item.location} · {item.campus}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </QueryState>

      <p className="mt-5 pb-4 text-center text-[12px] text-[#999]">已经到底啦</p>
    </div>
  )
}

