import {
  AlertFilled,
  BellOutlined,
  BookOutlined,
  EnvironmentFilled,
  EnvironmentOutlined,
  FireFilled,
  RightOutlined,
  SearchOutlined,
  TrophyFilled,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Badge, Input, Tag } from 'antd'
import clsx from 'clsx'
import { Link } from 'react-router-dom'

import { getCats } from '@/api/endpoints/cats'
import { QueryState } from '@/components/feedback/QueryState'
import { useCampus } from '@/hooks/useCampus'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asArray, asRecord, asString, toPaged } from '@/utils/format'

const campusMap: Record<string, string> = {
  SOFTWARE_PARK: '软件园校区',
  CENTRAL: '济南中心校区',
}

const campusList: Array<{ label: string; value: string }> = [
  { label: '济南中心校区', value: 'CENTRAL' },
  { label: '软件园校区', value: 'SOFTWARE_PARK' },
]

const chips = ['全部', '橘猫/橘白', '三花/玳瑁', '奶牛', '纯色', '长毛']

export function HomePage() {
  usePageTitle('首页')
  const { campus, setCampus } = useCampus()

  const catsQuery = useQuery({
    queryKey: ['cats', campus],
    queryFn: () => getCats({ campus, page: 1, pageSize: 12 }),
  })

  const list = toPaged<Record<string, unknown>>(catsQuery.data?.data).items
  const starCat = list[0]

  return (
    <div className="h5-content pb-3">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <p className="text-[11px] text-[#9e9e9e]">当前位置</p>
          <div className="mt-1 flex items-center gap-1.5 text-[16px] font-bold text-[#1a1a1a]">
            <EnvironmentFilled className="text-[14px] text-[#4caf50]" />
            <select
              className="max-w-[155px] bg-transparent pr-1 text-[15px] font-bold outline-none"
              value={campus}
              onChange={(event) => setCampus(event.target.value)}
            >
              {campusList.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Badge dot>
          <div className="top-icon-btn">
            <BellOutlined />
          </div>
        </Badge>
      </div>

      <div className="sticky top-0 z-20 -mx-5 bg-[#f8f6f4] px-5 pb-4">
        <Input
          allowClear
          className="!h-[44px] !rounded-full !border-none !bg-white"
          placeholder="搜索猫咪花名、花色或地点..."
          prefix={<SearchOutlined className="text-slate-400" />}
        />
      </div>

      <section className="mb-5 overflow-hidden rounded-[24px] bg-gradient-to-r from-[#bbfec6] via-[#7bf3f3] to-[#4de6f5] pt-4 shadow-[0_10px_25px_rgba(77,230,245,0.3)]">
        <div className="grid grid-cols-5 gap-1 px-2 text-center text-[#1a1a1a]">
          {[
            ['363', '猫校友'],
            ['223', '留园观察'],
            ['4', '待领养'],
            ['47', '已领养'],
            ['2', '毕业'],
          ].map(([num, label]) => (
            <div key={label}>
              <p className="text-[24px] font-extrabold leading-none">{num}</p>
              <p className="mt-1 text-[11px] font-semibold text-[#334155]">{label}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 flex items-center rounded-tr-[42px] bg-white/30 px-4 py-3 text-[14px] font-semibold text-[#111] backdrop-blur-sm">
          当前已绝育
          <span className="mx-1 text-[22px] font-extrabold">142</span>
          只流浪喵
        </div>
      </section>

      <section className="mb-5 grid grid-cols-[1.08fr_1fr] gap-3">
        <Link className="relative overflow-hidden rounded-[22px] bg-[#ffe7ab] p-4 shadow-[0_8px_16px_rgba(0,0,0,0.05)]" to="/user/leaderboard">
          <p className="text-[18px] font-bold text-[#5d4037]">封神榜</p>
          <p className="mt-1 text-[12px] text-[#8d6e63]">谁是校宠 No.1？</p>
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

      <Link
        className="mb-6 flex items-center justify-between overflow-hidden rounded-[22px] bg-white px-4 py-4 shadow-[0_10px_24px_rgba(0,0,0,0.08)]"
        to={`/user/cats/${asString(asRecord(starCat).id, '1')}`}
      >
        <div className="w-[58%]">
          <div className="inline-flex items-center gap-1 rounded-full bg-[#f5f5f5] px-3 py-1 text-[11px] font-semibold text-[#666]">
            <FireFilled className="text-[#ffb300]" />
            人气 TOP 1
          </div>
          <p className="mt-3 text-[20px] font-bold text-[#1a1a1a]">{asString(asRecord(starCat).name, '大橘座')}</p>
          <div className="mt-2 h-[8px] overflow-hidden rounded-full bg-[#f1f1f1]">
            <div className="h-full w-[85%] rounded-full bg-gradient-to-r from-[#ffd54f] to-[#ffb300]" />
          </div>
          <p className="mt-1 text-[11px] text-[#999]">今日已投喂 32 次（85%）</p>
        </div>
        <div className="relative h-[108px] w-[108px] rounded-[24px] bg-gradient-to-br from-[#e2e8f0] to-[#94a3b8]">
          <button
            className="absolute -left-3 bottom-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#ffd54f] text-[#3a2f14] shadow-[0_8px_12px_rgba(255,213,79,0.45)]"
            type="button"
          >
            🐟
          </button>
        </div>
      </Link>

      <div className="mb-3 flex items-end justify-between">
        <h2 className="section-title">全校图鉴</h2>
        <span className="text-[12px] text-[#999]">查看全部</span>
      </div>

      <div className="chip-row mb-4">
        {chips.map((chip, index) => (
          <button
            key={chip}
            className={clsx('chip-item', index === 0 && 'chip-item-active')}
            type="button"
          >
            {chip}
          </button>
        ))}
      </div>

      <QueryState error={catsQuery.error} isEmpty={!list.length} isLoading={catsQuery.isLoading}>
        <div className="grid grid-cols-2 gap-3">
          {list.slice(0, 8).map((cat, index) => {
            const item = asRecord(cat)
            const id = asString(item.id, String(index + 1))
            const tags = asArray<string>(item.tags)
            return (
              <Link
                key={id}
                className="overflow-hidden rounded-[18px] bg-white shadow-[0_8px_18px_rgba(0,0,0,0.06)]"
                to={`/user/cats/${id}`}
              >
                <div className="relative h-40 bg-gradient-to-br from-[#d1d5db] to-[#94a3b8]">
                  <span className="absolute right-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                    <EnvironmentOutlined className="mr-1" />
                    目击
                  </span>
                </div>
                <div className="px-3 pb-3 pt-2.5">
                  <p className="text-[15px] font-bold text-[#1f2937]">{asString(item.name, `猫咪${index + 1}`)}</p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {(tags.length ? tags : ['在校']).slice(0, 2).map((tag) => (
                      <Tag key={tag} className="!mr-0 !rounded-md !px-1.5 !py-0 !text-[10px]">
                        {tag}
                      </Tag>
                    ))}
                  </div>
                  <p className="mt-1.5 flex items-center gap-1 text-[10px] text-[#9ca3af]">
                    <EnvironmentOutlined />
                    {asString(item.location, campusMap[campus] ?? '未知地点')}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </QueryState>

      <p className="mt-5 pb-4 text-center text-[12px] text-[#999]">已经到底啦 🐱</p>
    </div>
  )
}
