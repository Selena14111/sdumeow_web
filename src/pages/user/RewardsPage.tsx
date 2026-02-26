import { ArrowLeftOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, message } from 'antd'
import clsx from 'clsx'
import { useNavigate } from 'react-router-dom'

import badgeBroadcaster from '@/assets/\u5fbd\u7ae0-\u4f20\u64ad\u5927\u4f7f.png'
import badgeFirstMeet from '@/assets/\u5fbd\u7ae0-\u521d\u6b21\u89c1\u9762.png'
import badgeGuardian from '@/assets/\u5fbd\u7ae0-\u5b88\u62a4\u5929\u4f7f.png'
import badgeLeaderboard from '@/assets/\u5fbd\u7ae0-\u6253\u699c\u738b.png'
import badgeExplorer from '@/assets/\u5fbd\u7ae0-\u63a2\u7d22\u5bb6.png'
import badgePopularizer from '@/assets/\u5fbd\u7ae0-\u79d1\u666e\u8fbe\u4eba.png'
import badgeRecorder from '@/assets/\u5fbd\u7ae0-\u8bb0\u5f55\u8005.png'
import badgeAdopter from '@/assets/\u5fbd\u7ae0-\u9886\u517b\u4eba.png'
import appLogo from '@/assets/\u732b\u732b\u56fe\u9274-logo.png'
import { checkin, getCheckinHistory, getMe } from '@/api/endpoints/user'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asArray, asNumber, asRecord, asString } from '@/utils/format'

type BadgeItem = {
  key: string
  name: string
  desc: string
  icon: string
  unlocked: boolean
}

const badgeTemplates: Omit<BadgeItem, 'unlocked'>[] = [
  { key: 'first_meet', name: '初次见面', desc: '首次投喂', icon: badgeFirstMeet },
  { key: 'recorder', name: '记录者', desc: '发布5条动态', icon: badgeRecorder },
  { key: 'explorer', name: '探索家', desc: '发现新猫咪', icon: badgeExplorer },
  { key: 'broadcaster', name: '传播大使', desc: '分享10次', icon: badgeBroadcaster },
  { key: 'adopter', name: '领养人', desc: '成功领养', icon: badgeAdopter },
  { key: 'leaderboard', name: '打榜王', desc: '投喂榜Top3', icon: badgeLeaderboard },
  { key: 'guardian', name: '守护天使', desc: '成功救助', icon: badgeGuardian },
  { key: 'popularizer', name: '科普达人', desc: '投稿被采纳', icon: badgePopularizer },
  { key: 'hidden', name: '???', desc: '隐藏成就', icon: appLogo },
]

function formatDay(date: Date): string {
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeDate(value: unknown): string {
  const text = asString(value, '').trim()
  if (!text) {
    return ''
  }

  const dayMatch = text.match(/\d{4}-\d{2}-\d{2}/)
  if (dayMatch) {
    return dayMatch[0]
  }

  if (/^\d+$/.test(text)) {
    const timestamp = Number(text)
    if (Number.isFinite(timestamp) && timestamp > 0) {
      const date = new Date(timestamp > 1_000_000_000_000 ? timestamp : timestamp * 1000)
      if (!Number.isNaN(date.getTime())) {
        return formatDay(date)
      }
    }
  }

  return ''
}

function collectCheckinDays(value: unknown): Set<string> {
  const result = new Set<string>()
  const root = asRecord(value)
  const sources: unknown[] = [root.items, root.days, root.records, value]

  sources.forEach((source) => {
    const list = asArray<unknown>(source)
    list.forEach((item) => {
      if (typeof item === 'string') {
        const day = normalizeDate(item)
        if (day) {
          result.add(day)
        }
        return
      }

      const row = asRecord(item)
      const day = normalizeDate(
        row.date || row.day || row.checkinDate || row.signDate || row.createTime || row.createdAt || row.time,
      )
      if (day) {
        result.add(day)
      }
    })
  })

  return result
}

export function RewardsPage() {
  usePageTitle('荣誉勋章墙')
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
  })

  const historyQuery = useQuery({
    queryKey: ['checkin-history'],
    queryFn: getCheckinHistory,
  })

  const profile = asRecord(meQuery.data?.data)
  const stats = asRecord(profile.stats)
  const level = asNumber(profile.level, 1)
  const feedCount = asNumber(stats.feedCount, 0)
  const momentCount = asNumber(stats.momentCount, 0)
  const foundNewCatCount = asNumber(stats.foundNewCatCount, asNumber(stats.found, 0))
  const receivedLikes = asNumber(stats.receivedLikes, 0)
  const adoptionCount = asNumber(stats.adoptedCount, asNumber(stats.adoptionCount, 0))
  const rescueCount = asNumber(stats.rescueCount, asNumber(stats.sosResolvedCount, 0))
  const articleCount = asNumber(stats.articleCount, asNumber(stats.publishedArticles, 0))

  const checkinDays = collectCheckinDays(historyQuery.data?.data)
  const checkedDayCount = checkinDays.size
  const todayChecked = checkinDays.has(formatDay(new Date()))

  const currentExp = checkedDayCount * 5 + feedCount * 2 + momentCount * 6 + foundNewCatCount * 10 + receivedLikes
  const nextLevelExp = level * 500
  const currentLevelExp = currentExp % 500
  const progressPercent = Math.max(0, Math.min(100, Math.round((currentLevelExp / 500) * 100)))

  const badges: BadgeItem[] = badgeTemplates.map((item) => {
    let unlocked = false
    switch (item.key) {
      case 'first_meet':
        unlocked = feedCount > 0
        break
      case 'recorder':
        unlocked = momentCount >= 5
        break
      case 'explorer':
        unlocked = foundNewCatCount > 0
        break
      case 'broadcaster':
        unlocked = momentCount >= 10
        break
      case 'adopter':
        unlocked = adoptionCount > 0
        break
      case 'leaderboard':
        unlocked = receivedLikes >= 100
        break
      case 'guardian':
        unlocked = rescueCount > 0
        break
      case 'popularizer':
        unlocked = articleCount > 0
        break
      case 'hidden':
        unlocked = checkedDayCount >= 30
        break
      default:
        unlocked = false
    }
    return { ...item, unlocked }
  })

  const unlockedCount = badges.filter((item) => item.unlocked).length

  const checkinMutation = useMutation({
    mutationFn: checkin,
    onSuccess: async () => {
      message.success('签到成功，经验值 +5')
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['me'] }),
        queryClient.invalidateQueries({ queryKey: ['checkin-history'] }),
      ])
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '签到失败'),
  })

  return (
    <div className="min-h-screen bg-[#1a1a1a] pb-8 text-white">
      <div className="px-5 pt-5">
        <button className="top-icon-btn !bg-transparent !text-white shadow-none" type="button" onClick={() => navigate(-1)}>
          <ArrowLeftOutlined />
        </button>
      </div>

      <header className="bg-[radial-gradient(circle_at_top,#333_0%,#1a1a1a_70%)] px-5 pb-7 pt-5 text-center">
        <div className="mx-auto mb-3 h-20 w-20">
          <img alt="SDU Meow logo" className="h-full w-full object-contain" src={appLogo} />
        </div>
        <h1 className="text-[24px] font-extrabold">荣誉勋章墙</h1>
        <p className="mt-1 text-[12px] text-[#ccc]">{`已点亮 ${unlockedCount} / ${badgeTemplates.length} 枚勋章`}</p>
      </header>

      <QueryState error={meQuery.error} isLoading={meQuery.isLoading}>
        <div className="px-5">
          <section className="mb-5 rounded-[10px] bg-[#333] p-4">
            <div className="mb-2 flex items-center justify-between text-[12px]">
              <span>{`下一等级：Lv.${level + 1}`}</span>
              <span className="text-[#ffd54f]">{`${currentLevelExp} / 500 经验`}</span>
            </div>
            <div className="h-2 overflow-hidden rounded bg-black">
              <div className="h-full bg-gradient-to-r from-[#ffd54f] to-[#ffa000]" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="mt-2 text-[11px] text-[#aaa]">{`累计签到 ${checkedDayCount} 天，当前预估总经验 ${currentExp}/${nextLevelExp}`}</p>
          </section>

          <section className="grid grid-cols-3 gap-y-5">
            {badges.map((badge) => (
              <div key={badge.key} className={clsx('text-center', !badge.unlocked && 'opacity-50 grayscale')}>
                <div
                  className={clsx(
                    'mx-auto mb-2 flex h-20 w-[70px] items-center justify-center',
                    badge.unlocked
                      ? 'bg-gradient-to-br from-[#2a2a2a] to-[#444] shadow-[0_0_15px_rgba(255,213,79,0.2)]'
                      : 'bg-[#2a2a2a]',
                  )}
                  style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                >
                  <img alt={badge.name} className="h-12 w-12 object-contain" src={badge.icon} />
                </div>
                <p className="text-[12px] font-semibold">{badge.name}</p>
                <p className="text-[10px] text-[#888]">{badge.desc}</p>
              </div>
            ))}
          </section>

          <Button
            block
            className="!mt-7 !h-11 !rounded-full !border-none !bg-[#ffd54f] !font-semibold !text-[#1a1a1a]"
            disabled={todayChecked}
            loading={checkinMutation.isPending}
            onClick={() => checkinMutation.mutate()}
          >
            {todayChecked ? '今日已签到' : '每日签到领取经验'}
          </Button>
        </div>
      </QueryState>
    </div>
  )
}
