import { ArrowLeftOutlined, CrownFilled } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { getLeaderboard } from '@/api/endpoints/leaderboard'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asNumber, asRecord, asString, toPaged } from '@/utils/format'

type RankCat = {
  rank: number
  catId: string
  name: string
  avatar: string
  campus: string
  feedCount: number
}

function normalizeLeaderboard(payload: unknown): RankCat[] {
  const items = toPaged<Record<string, unknown>>(payload).items

  return items
    .map((item, index) => {
      const row = asRecord(item)
      const rank = asNumber(row.rank, index + 1)

      return {
        rank,
        catId: asString(row.catId || row.id),
        name: asString(row.name, `猫咪 ${rank}`),
        avatar: asString(row.avatar, ''),
        campus: asString(row.campus, '未知校区'),
        feedCount: asNumber(row.value, asNumber(row.feedCount, asNumber(row.popularity, 0))),
      }
    })
    .sort((a, b) => a.rank - b.rank)
}

export function LeaderboardPage() {
  usePageTitle('全校封神榜')
  const navigate = useNavigate()

  const query = useQuery({
    queryKey: ['leaderboard', 'popularity'],
    queryFn: () => getLeaderboard('popularity'),
  })

  const rankedCats = useMemo(() => normalizeLeaderboard(query.data?.data), [query.data?.data])
  const topThree = useMemo(() => {
    const source = rankedCats.slice(0, 3)
    const first = source.find((item) => item.rank === 1)
    const second = source.find((item) => item.rank === 2)
    const third = source.find((item) => item.rank === 3)
    const ordered = [second, first, third].filter((item): item is RankCat => Boolean(item))

    return ordered.length === source.length ? ordered : source
  }, [rankedCats])
  const followRanks = rankedCats.slice(3)

  return (
    <div className="h5-content pb-6">
      <div className="mb-5 flex items-center">
        <button className="top-icon-btn" type="button" onClick={() => navigate(-1)}>
          <ArrowLeftOutlined />
        </button>
        <h1 className="flex-1 text-center text-[18px] font-bold">全校封神榜</h1>
        <span className="w-9" />
      </div>

      <div className="mb-7 flex rounded-full bg-white p-1 shadow-[0_8px_16px_rgba(0,0,0,0.06)]">
        <button className="flex-1 rounded-full bg-[#1a1a1a] py-2 text-[13px] font-semibold text-white" type="button">
          人气榜
        </button>
      </div>

      <QueryState
        error={query.error}
        isEmpty={!query.isLoading && !query.error && rankedCats.length === 0}
        isLoading={query.isLoading}
        emptyDescription="暂无投喂排行数据"
      >
        <div className="mb-7 flex items-end justify-center gap-4">
          {topThree.map((item) => {
            const first = item.rank === 1
            const content = (
              <>
                <div className="relative mx-auto">
                  {first ? <CrownFilled className="absolute -top-5 left-1/2 -translate-x-1/2 text-[22px] text-[#ffd700]" /> : null}
                  <div
                    className={clsx(
                      'overflow-hidden rounded-full bg-gradient-to-br from-[#d1d5db] to-[#94a3b8]',
                      first ? 'h-[90px] w-[90px] border-4 border-[#ffd700]' : 'h-[72px] w-[72px] border-4 border-white',
                    )}
                  >
                    {item.avatar ? <img alt={item.name} className="h-full w-full object-cover" src={item.avatar} /> : null}
                  </div>
                  <div
                    className={clsx(
                      'mx-auto -mt-3 flex items-center justify-center rounded-full border-2 border-white text-[12px] font-extrabold text-white',
                      first ? 'h-[30px] w-[30px] bg-[#ffd700] text-[14px]' : item.rank === 2 ? 'h-6 w-6 bg-[#c0c0c0]' : 'h-6 w-6 bg-[#cd7f32]',
                    )}
                  >
                    {item.rank}
                  </div>
                </div>
                <p className={clsx('mt-2 font-bold text-[#333]', first ? 'text-[15px]' : 'text-[13px]')}>{item.name}</p>
                <p className={clsx('text-[11px]', first ? 'font-semibold text-[#ffa000]' : 'text-[#999]')}>{item.feedCount} 次投喂</p>
              </>
            )

            return item.catId ? (
              <Link key={item.catId} className={clsx('text-center', first && '-translate-y-4')} to={`/user/cats/${item.catId}`}>
                {content}
              </Link>
            ) : (
              <div key={`${item.name}-${item.rank}`} className={clsx('text-center', first && '-translate-y-4')}>
                {content}
              </div>
            )
          })}
        </div>

        <div className="space-y-3">
          {followRanks.map((item) => {
            const rowContent = (
              <>
                <div className="w-8 text-center text-[16px] font-bold text-[#ccc]">{item.rank}</div>
                <div className="mr-3 h-10 w-10 overflow-hidden rounded-full bg-gradient-to-br from-[#d1d5db] to-[#94a3b8]">
                  {item.avatar ? <img alt={item.name} className="h-full w-full object-cover" src={item.avatar} /> : null}
                </div>
                <div className="flex-1">
                  <p className="text-[14px] font-semibold text-[#333]">{item.name}</p>
                  <p className="text-[11px] text-[#999]">常驻：{item.campus}</p>
                </div>
                <span className="text-[14px] font-semibold text-[#555]">{item.feedCount} 次</span>
              </>
            )

            return item.catId ? (
              <Link
                key={item.catId}
                className="flex items-center rounded-[16px] bg-white px-3 py-3 shadow-[0_8px_16px_rgba(0,0,0,0.06)]"
                to={`/user/cats/${item.catId}`}
              >
                {rowContent}
              </Link>
            ) : (
              <div key={`${item.name}-${item.rank}`} className="flex items-center rounded-[16px] bg-white px-3 py-3 shadow-[0_8px_16px_rgba(0,0,0,0.06)]">
                {rowContent}
              </div>
            )
          })}
        </div>
      </QueryState>
    </div>
  )
}
