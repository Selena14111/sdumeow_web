import { ArrowLeftOutlined, CrownFilled } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { useNavigate } from 'react-router-dom'

import { ApiNotFoundError } from '@/api/adapters/errors'
import { getLeaderboard } from '@/api/endpoints/leaderboard'
import { ApiUnavailable } from '@/components/feedback/ApiUnavailable'
import { usePageTitle } from '@/hooks/usePageTitle'

const topThree = [
  { rank: 2, name: 'Ctrl', votes: 982 },
  { rank: 1, name: '大橘座', votes: 1204 },
  { rank: 3, name: '麻薯', votes: 856 },
]

const followRanks = [
  { rank: 4, name: '大白', votes: 532, location: '图书馆' },
  { rank: 5, name: '小笼包', votes: 410, location: '软件园' },
]

const tabs = ['人气榜', '颜值榜', '吃货榜']

export function LeaderboardPage() {
  usePageTitle('全校封神榜')
  const navigate = useNavigate()

  const query = useQuery({
    queryKey: ['leaderboard', 'popularity'],
    queryFn: () => getLeaderboard('popularity'),
  })

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
        {tabs.map((tab, index) => (
          <button
            key={tab}
            className={clsx(
              'flex-1 rounded-full py-2 text-[13px] font-semibold transition',
              index === 0 ? 'bg-[#1a1a1a] text-white' : 'text-[#999]',
            )}
            type="button"
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="mb-7 flex items-end justify-center gap-4">
        {topThree.map((item) => {
          const first = item.rank === 1
          return (
            <div key={item.rank} className={clsx('text-center', first && '-translate-y-4')}>
              <div className="relative mx-auto">
                {first ? <CrownFilled className="absolute -top-5 left-1/2 -translate-x-1/2 text-[22px] text-[#ffd700]" /> : null}
                <div
                  className={clsx(
                    'rounded-full bg-gradient-to-br from-[#d1d5db] to-[#94a3b8]',
                    first ? 'h-[90px] w-[90px] border-4 border-[#ffd700]' : 'h-[72px] w-[72px] border-4 border-white',
                  )}
                />
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
              <p className={clsx('text-[11px]', first ? 'font-semibold text-[#ffa000]' : 'text-[#999]')}>{item.votes} 票</p>
            </div>
          )
        })}
      </div>

      <div className="space-y-3">
        {followRanks.map((item) => (
          <div key={item.rank} className="flex items-center rounded-[16px] bg-white px-3 py-3 shadow-[0_8px_16px_rgba(0,0,0,0.06)]">
            <div className="w-8 text-center text-[16px] font-bold text-[#ccc]">{item.rank}</div>
            <div className="mr-3 h-10 w-10 rounded-full bg-gradient-to-br from-[#d1d5db] to-[#94a3b8]" />
            <div className="flex-1">
              <p className="text-[14px] font-semibold text-[#333]">{item.name}</p>
              <p className="text-[11px] text-[#999]">常驻：{item.location}</p>
            </div>
            <span className="text-[14px] font-semibold text-[#555]">{item.votes} 票</span>
          </div>
        ))}
      </div>

      {query.error instanceof ApiNotFoundError ? (
        <div className="mt-5">
          <ApiUnavailable title="榜单接口暂不可用，当前展示设计态" onRetry={() => query.refetch()} />
        </div>
      ) : null}
    </div>
  )
}
