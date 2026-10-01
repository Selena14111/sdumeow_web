import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  CloseOutlined,
  LeftOutlined,
  LockFilled,
  RightOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import type { WheelEvent } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import badgeAdopter from '@/assets/徽章-领养人.png'
import badgeExplorer from '@/assets/徽章-探索家.png'
import badgeGuardian from '@/assets/徽章-守护天使.png'
import badgeFeed from '@/assets/投喂.png'
import badgeLikes from '@/assets/收到点赞.png'
import badgePosts from '@/assets/发布帖子.png'
import badgeStreakCheckin from '@/assets/连续签到.png'
import badgeTotalCheckin from '@/assets/累计签到.png'
import appLogo from '@/assets/猫猫图鉴-logo.png'
import { getAllBadges, getMe } from '@/api/endpoints/user'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asArray, asNumber, asRecord, asString } from '@/utils/format'

const AUTO_CHECKIN_TOTAL_DAYS_STORAGE_KEY = 'user:auto-checkin:total-days'
const AUTO_CHECKIN_CONTINUOUS_DAYS_STORAGE_KEY = 'user:auto-checkin:continuous-days'

type ApiBadge = {
  id: number
  name: string
  description: string
  tier: number
  owned: boolean
  awardedAt: string
  current: number | null
  target: number | null
  percent: number | null
}

type BadgeLevel = ApiBadge & {
  targetValue: number | null
}

type TierGroupDef = {
  key: string
  title: string
  ids: readonly [number, number]
  icon: string
  statLabel: string
  unit: string
  fallbackTargets: readonly number[]
  fallbackDescription: (target: number) => string
}

type TierBadgeGroup = {
  kind: 'tiered'
  key: string
  name: string
  desc: string
  icon: string
  unlocked: boolean
  levels: BadgeLevel[]
  currentValue: number
  statLabel: string
  unit: string
  unlockedCount: number
  totalCount: number
  progressTitle: string
  progressText: string
  progressPercent: number
}

type SimpleBadge = {
  kind: 'simple' | 'hidden'
  key: string
  name: string
  desc: string
  icon: string
  unlocked: boolean
  progressText: string
  progressPercent: number
}

type GridBadge = TierBadgeGroup | SimpleBadge

const tierGroupDefs: TierGroupDef[] = [
  {
    key: 'posts',
    title: '发布帖子',
    ids: [1, 4],
    icon: badgePosts,
    statLabel: '已发布',
    unit: '篇',
    fallbackTargets: [1, 5, 10, 20],
    fallbackDescription: (target) => `发布 ${target} 篇帖子`,
  },
  {
    key: 'likes',
    title: '收到点赞',
    ids: [5, 9],
    icon: badgeLikes,
    statLabel: '已收到',
    unit: '个赞',
    fallbackTargets: [1, 10, 50, 100, 500],
    fallbackDescription: (target) => `收到 ${target} 个点赞`,
  },
  {
    key: 'feed',
    title: '投喂',
    ids: [10, 14],
    icon: badgeFeed,
    statLabel: '已投喂',
    unit: '次',
    fallbackTargets: [1, 10, 50, 100, 500],
    fallbackDescription: (target) => `投喂 ${target} 次`,
  },
  {
    key: 'streakCheckin',
    title: '连续签到',
    ids: [15, 19],
    icon: badgeStreakCheckin,
    statLabel: '已连续',
    unit: '天',
    fallbackTargets: [1, 3, 7, 14, 30],
    fallbackDescription: (target) => `连续签到 ${target} 天`,
  },
  {
    key: 'totalCheckin',
    title: '累计签到',
    ids: [20, 24],
    icon: badgeTotalCheckin,
    statLabel: '已累计',
    unit: '天',
    fallbackTargets: [1, 7, 30, 60, 100],
    fallbackDescription: (target) => `累计签到 ${target} 天`,
  },
]

const tierLabelMap: Record<number, string> = {
  1: '铜牌',
  2: '银牌',
  3: '金牌',
  4: '稀有',
  5: '传说',
}

function getTierLabel(tier: number): string {
  return tierLabelMap[tier] ?? `Lv.${tier}`
}

function getTierDropShadow(tier: number): string {
  if (tier === 1) return 'drop-shadow(0 0 12px rgba(205, 127, 50, 0.7)) drop-shadow(0 0 14px rgba(205, 127, 50, 0.28))'
  if (tier === 2) return 'drop-shadow(0 0 12px rgba(210, 222, 232, 0.74)) drop-shadow(0 0 14px rgba(148, 163, 184, 0.34))'
  if (tier === 3) return 'drop-shadow(0 0 13.5px rgba(255, 213, 79, 0.78)) drop-shadow(0 0 16px rgba(255, 160, 0, 0.34))'
  if (tier === 4) return 'drop-shadow(0 0 13.5px rgba(94, 234, 212, 0.76)) drop-shadow(0 0 17px rgba(45, 212, 191, 0.34))'
  return 'drop-shadow(0 0 10px rgba(192, 132, 252, 0.82)) drop-shadow(0 0 18px rgba(236, 72, 153, 0.36))'
}

function readStoredNumber(key: string): number | null {
  if (typeof window === 'undefined') return null
  const raw = window.localStorage.getItem(key)
  if (!raw) return null
  const value = Number(raw)
  if (!Number.isFinite(value) || value < 0) return null
  return Math.floor(value)
}

function toFiniteNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string') return null

  const normalized = value.trim().replace(/[,，]/g, '')
  if (!normalized) return null

  const numericValue = Number(normalized)
  return Number.isFinite(numericValue) ? numericValue : null
}

function firstNumber(...values: unknown[]): number | null {
  for (const value of values) {
    const numericValue = toFiniteNumber(value)
    if (numericValue !== null) return numericValue
  }
  return null
}

function toOwned(value: unknown): boolean {
  if (value === true || value === 1) return true
  if (typeof value !== 'string') return false
  const normalized = value.trim().toLowerCase()
  return normalized === 'true' || normalized === '1' || normalized === 'yes'
}

function extractTargetFromDescription(description: string): number | null {
  const numbers = Array.from(description.replace(/[,，]/g, '').matchAll(/\d+(?:\.\d+)?/g), (match) => Number(match[0]))
  if (!numbers.length) return null
  return Math.max(...numbers)
}

function formatDateTime(value: string): string {
  if (!value) return ''
  return value.replace('T', ' ').slice(0, 16)
}

function normalizeBadge(value: unknown): ApiBadge | null {
  const row = asRecord(value)
  const id = firstNumber(row.id)
  if (id === null) return null

  const tier = firstNumber(row.tier) ?? id
  const progress = asRecord(row.progress)

  return {
    id: Math.floor(id),
    name: asString(row.name, `Lv.${Math.floor(tier)}`),
    description: asString(row.description),
    tier: Math.floor(tier),
    owned: toOwned(row.owned ?? row.unlocked ?? row.achieved),
    awardedAt: asString(row.awardedAt ?? row.awardTime ?? row.createdAt),
    current: firstNumber(row.current, row.currentValue, row.progressCurrent, progress.current, progress.value),
    target: firstNumber(row.target, row.targetValue, row.progressTarget, progress.target, progress.total),
    percent: firstNumber(row.percent, row.progressPercent, progress.percent),
  }
}

function normalizeBadges(payload: unknown): ApiBadge[] {
  return asArray<unknown>(payload)
    .map(normalizeBadge)
    .filter((badge): badge is ApiBadge => Boolean(badge))
    .sort((a, b) => a.id - b.id)
}

function resolveLevelTarget(level: ApiBadge, def: TierGroupDef): number | null {
  return level.target ?? extractTargetFromDescription(level.description) ?? def.fallbackTargets[level.tier - 1] ?? null
}

function createFallbackLevel(def: TierGroupDef, index: number): ApiBadge {
  const tier = index + 1
  const target = def.fallbackTargets[index] ?? def.fallbackTargets[def.fallbackTargets.length - 1] ?? tier

  return {
    id: def.ids[0] + index,
    name: `${def.title} Lv.${tier}`,
    description: def.fallbackDescription(target),
    tier,
    owned: false,
    awardedAt: '',
    current: null,
    target,
    percent: null,
  }
}

function buildTierGroup(def: TierGroupDef, badges: ApiBadge[], statValue: number): TierBadgeGroup {
  const expectedCount = def.ids[1] - def.ids[0] + 1
  const serverLevels = badges
    .filter((badge) => badge.id >= def.ids[0] && badge.id <= def.ids[1])
    .sort((a, b) => a.tier - b.tier || a.id - b.id)
  const rawLevels = serverLevels.length ? serverLevels : Array.from({ length: expectedCount }, (_, index) => createFallbackLevel(def, index))
  const levels: BadgeLevel[] = rawLevels.map((level) => ({
    ...level,
    targetValue: resolveLevelTarget(level, def),
  }))
  const ownedLevels = levels.filter((level) => level.owned)
  const unlockedTarget = ownedLevels.reduce((maxTarget, level) => {
    const target = level.targetValue ?? 0
    return Math.max(maxTarget, target)
  }, 0)
  const currentValue = Math.max(0, Math.floor(Math.max(statValue, unlockedTarget)))
  const nextLevel = levels.find((level) => !level.owned) ?? null
  const target = nextLevel?.targetValue ?? null
  const progressPercent = nextLevel
    ? Math.max(
      0,
      Math.min(100, Math.round(nextLevel.percent ?? (target && target > 0 ? (currentValue / target) * 100 : 0))),
    )
    : 100
  const progressText = nextLevel
    ? target
      ? `${Math.min(currentValue, target)} / ${target} ${def.unit}`
      : `${currentValue} ${def.unit}`
    : `${levels.length} / ${levels.length} 级`

  return {
    kind: 'tiered',
    key: def.key,
    name: def.title,
    desc: nextLevel ? `下一等级：${nextLevel.name}` : '全部等级已完成',
    icon: def.icon,
    unlocked: ownedLevels.length > 0,
    levels,
    currentValue,
    statLabel: def.statLabel,
    unit: def.unit,
    unlockedCount: ownedLevels.length,
    totalCount: levels.length,
    progressTitle: nextLevel ? `下一等级：${nextLevel.name}` : '全部等级已完成',
    progressText,
    progressPercent,
  }
}

function getBadgeStatusText(badge: GridBadge): string {
  if (badge.kind === 'tiered') {
    return badge.unlocked ? `Lv.${badge.unlockedCount} / ${badge.totalCount}` : '未点亮'
  }
  return badge.unlocked ? '已点亮' : '未点亮'
}

function getLevelStatusText(level: BadgeLevel): string {
  if (!level.owned) return '未点亮'
  const awardedAt = formatDateTime(level.awardedAt)
  return awardedAt ? `已获得 · ${awardedAt}` : '已获得'
}

function getLevelProgress(group: TierBadgeGroup, level: BadgeLevel) {
  const target = level.targetValue
  const current = target ? Math.min(group.currentValue, target) : group.currentValue
  const calculatedPercent = target && target > 0 ? (group.currentValue / target) * 100 : level.owned ? 100 : 0
  const progressPercent = level.owned
    ? 100
    : Math.max(0, Math.min(100, Math.round(level.percent ?? calculatedPercent)))

  return {
    title: `${level.name}进度`,
    text: target ? `${current} / ${target} ${group.unit}` : `${group.currentValue} ${group.unit}`,
    percent: progressPercent,
  }
}

export function RewardsPage() {
  usePageTitle('荣誉勋章墙')
  const navigate = useNavigate()
  const detailTrackRef = useRef<HTMLDivElement | null>(null)
  const scrollSettleTimerRef = useRef<number | null>(null)
  const programmaticDetailIndexRef = useRef<number | null>(null)
  const [activeBadgeKey, setActiveBadgeKey] = useState<string | null>(null)
  const [detailIndex, setDetailIndex] = useState(0)
  const checkinTotalDays = readStoredNumber(AUTO_CHECKIN_TOTAL_DAYS_STORAGE_KEY)
  const checkinContinuousDays = readStoredNumber(AUTO_CHECKIN_CONTINUOUS_DAYS_STORAGE_KEY)

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
  })
  const badgesQuery = useQuery({
    queryKey: ['badges', 'all'],
    queryFn: getAllBadges,
  })

  const profile = asRecord(meQuery.data?.data)
  const stats = asRecord(profile.stats)
  const level = Math.max(1, Math.floor(firstNumber(profile.level) ?? 1))
  const feedCount = Math.max(0, Math.floor(firstNumber(stats.feedCount, profile.feedCount) ?? 0))
  const momentCount = Math.max(
    0,
    Math.floor(firstNumber(stats.momentCount, stats.postCount, stats.postsCount, stats.dynamicCount, profile.momentCount) ?? 0),
  )
  const receivedLikes = Math.max(
    0,
    Math.floor(firstNumber(stats.receivedLikes, stats.likeCount, stats.likes, profile.receivedLikes, profile.likeCount) ?? 0),
  )
  const foundNewCatCount = Math.max(0, Math.floor(firstNumber(stats.foundNewCatCount, stats.found, profile.foundNewCatCount) ?? 0))
  const adoptionCount = Math.max(0, Math.floor(firstNumber(stats.adoptedCount, stats.adoptionCount, profile.adoptionCount) ?? 0))
  const rescueCount = Math.max(0, Math.floor(firstNumber(stats.rescueCount, stats.sosResolvedCount, profile.rescueCount) ?? 0))
  const checkinDaysFromProfile = firstNumber(stats.totalDays, stats.checkinDays, stats.checkinCount, profile.totalDays)
  const checkinDays = checkinTotalDays ?? Math.max(0, Math.floor(checkinDaysFromProfile ?? 0))
  const streakDaysFromProfile = firstNumber(
    stats.continuousDays,
    stats.consecutiveDays,
    stats.streakDays,
    stats.checkinStreak,
    profile.continuousDays,
  )
  const streakDays = checkinContinuousDays ?? Math.max(0, Math.floor(streakDaysFromProfile ?? 0))
  const exp = Math.max(0, asNumber(profile.exp, 0))
  const nextExp = Math.max(0, asNumber(profile.nextExp, 0))
  const progressPercent = nextExp > 0 ? Math.max(0, Math.min(100, Math.round((exp / nextExp) * 100))) : 0

  const apiBadges = useMemo(() => normalizeBadges(badgesQuery.data?.data), [badgesQuery.data?.data])
  const tierBadges = useMemo(
    () =>
      tierGroupDefs.map((def) => {
        const statValue =
          def.key === 'posts'
            ? momentCount
            : def.key === 'likes'
              ? receivedLikes
              : def.key === 'feed'
                ? feedCount
                : def.key === 'streakCheckin'
                  ? streakDays
                  : checkinDays
        return buildTierGroup(def, apiBadges, statValue)
      }),
    [apiBadges, checkinDays, feedCount, momentCount, receivedLikes, streakDays],
  )
  const simpleBadges: SimpleBadge[] = [
    {
      kind: 'simple',
      key: 'explorer',
      name: '探索家',
      desc: '发现新猫咪',
      icon: badgeExplorer,
      unlocked: foundNewCatCount > 0,
      progressText: `${foundNewCatCount} 次发现`,
      progressPercent: foundNewCatCount > 0 ? 100 : 0,
    },
    {
      kind: 'simple',
      key: 'adopter',
      name: '领养人',
      desc: '成功领养',
      icon: badgeAdopter,
      unlocked: adoptionCount > 0,
      progressText: `${adoptionCount} 次领养`,
      progressPercent: adoptionCount > 0 ? 100 : 0,
    },
    {
      kind: 'simple',
      key: 'guardian',
      name: '守护天使',
      desc: '成功救助',
      icon: badgeGuardian,
      unlocked: rescueCount > 0,
      progressText: `${rescueCount} 次救助`,
      progressPercent: rescueCount > 0 ? 100 : 0,
    },
  ]
  const hiddenBadge: SimpleBadge = {
    kind: 'hidden',
    key: 'hidden',
    name: '???',
    desc: '隐藏成就',
    icon: appLogo,
    unlocked: checkinDays >= 30,
    progressText: `${Math.min(checkinDays, 30)} / 30 天`,
    progressPercent: Math.max(0, Math.min(100, Math.round((checkinDays / 30) * 100))),
  }
  const badges: GridBadge[] = [...tierBadges, ...simpleBadges, hiddenBadge]
  const activeBadge = badges.find((badge) => badge.key === activeBadgeKey) ?? null
  const unlockedCount = badges.filter((item) => item.unlocked).length
  const activeTierLevel =
    activeBadge?.kind === 'tiered'
      ? activeBadge.levels[Math.max(0, Math.min(activeBadge.levels.length - 1, detailIndex))] ?? null
      : null
  const activeTierProgress =
    activeBadge?.kind === 'tiered' && activeTierLevel ? getLevelProgress(activeBadge, activeTierLevel) : null

  useEffect(() => {
    setDetailIndex(0)
    programmaticDetailIndexRef.current = null
    if (scrollSettleTimerRef.current !== null) {
      window.clearTimeout(scrollSettleTimerRef.current)
      scrollSettleTimerRef.current = null
    }
    detailTrackRef.current?.scrollTo({ left: 0 })
  }, [activeBadgeKey])

  useEffect(
    () => () => {
      if (scrollSettleTimerRef.current !== null) {
        window.clearTimeout(scrollSettleTimerRef.current)
      }
    },
    [],
  )

  const scheduleDetailIndexUpdate = (nextIndex: number) => {
    if (scrollSettleTimerRef.current !== null) {
      window.clearTimeout(scrollSettleTimerRef.current)
    }
    scrollSettleTimerRef.current = window.setTimeout(() => {
      setDetailIndex(nextIndex)
      programmaticDetailIndexRef.current = null
      scrollSettleTimerRef.current = null
    }, 120)
  }

  const handleDetailScroll = () => {
    const track = detailTrackRef.current
    if (!track || track.clientWidth <= 0) return
    const nextIndex = Math.round(track.scrollLeft / track.clientWidth)
    scheduleDetailIndexUpdate(programmaticDetailIndexRef.current ?? nextIndex)
  }

  const handleDetailWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!detailTrackRef.current || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return
    event.preventDefault()
    detailTrackRef.current.scrollBy({ left: event.deltaY, behavior: 'smooth' })
  }

  const scrollDetail = (direction: -1 | 1) => {
    if (!activeBadge || activeBadge.kind !== 'tiered') return
    const nextIndex = Math.max(0, Math.min(activeBadge.levels.length - 1, detailIndex + direction))
    programmaticDetailIndexRef.current = nextIndex
    setDetailIndex(nextIndex)
    detailTrackRef.current?.scrollTo({
      left: nextIndex * (detailTrackRef.current.clientWidth || 0),
      behavior: 'smooth',
    })
  }

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
        <p className="mt-1 text-[12px] text-[#ccc]">{`已点亮 ${unlockedCount} / ${badges.length} 枚勋章`}</p>
      </header>

      <QueryState error={meQuery.error || badgesQuery.error} isLoading={meQuery.isLoading || badgesQuery.isLoading}>
        <div className="px-5">
          <section className="mb-5 rounded-[10px] bg-[#333] p-4">
            <div className="mb-2 flex items-center justify-between text-[12px]">
              <span>{`下一等级：Lv.${level + 1}`}</span>
              <span className="text-[#ffd54f]">{`${exp} / ${nextExp} 经验`}</span>
            </div>
            <div className="h-2 overflow-hidden rounded bg-black">
              <div className="h-full bg-gradient-to-r from-[#ffd54f] to-[#ffa000]" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="mt-2 text-[11px] text-[#aaa]">{`连续签到 ${streakDays} 天 · 累计签到 ${checkinDays} 天`}</p>
          </section>

          <section className="grid grid-cols-3 gap-x-3 gap-y-5">
            {badges.map((badge) => (
              <button
                key={badge.key}
                aria-label={`查看${badge.name}徽章`}
                className={clsx('min-h-[130px] text-center outline-none transition active:scale-95', badge.unlocked ? 'opacity-100' : 'opacity-55')}
                type="button"
                onClick={() => setActiveBadgeKey(badge.key)}
              >
                <div
                  className={clsx(
                    'mx-auto mb-2 flex h-20 w-[70px] items-center justify-center',
                    badge.unlocked
                      ? 'bg-gradient-to-br from-[#2a2a2a] to-[#444] shadow-[0_0_15px_rgba(255,213,79,0.22)]'
                      : 'bg-[#2a2a2a]',
                  )}
                  style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                >
                  <img
                    alt={badge.name}
                    className={clsx('h-14 w-14 object-contain', badge.unlocked ? 'grayscale-0 saturate-100' : 'grayscale')}
                    src={badge.icon}
                  />
                </div>
                <p className="text-[12px] font-semibold leading-tight">{badge.name}</p>
                <p className="mt-1 text-[10px] leading-tight text-[#888]">{getBadgeStatusText(badge)}</p>
              </button>
            ))}
          </section>
        </div>
      </QueryState>

      {activeBadge ? (
        <div
          aria-modal="true"
          className="fixed inset-y-0 left-1/2 z-50 w-full max-w-[390px] -translate-x-1/2 overflow-y-auto bg-[radial-gradient(circle_at_top,#444_0%,#151515_58%,#050505_100%)] px-5 pb-8 pt-20 shadow-[0_0_40px_rgba(0,0,0,0.32)] backdrop-blur-sm"
          role="dialog"
          onClick={() => setActiveBadgeKey(null)}
        >
          <button
            aria-label="关闭"
            className="absolute left-5 top-8 z-10 flex h-12 w-12 items-center justify-center text-[30px] text-white"
            type="button"
            onClick={() => setActiveBadgeKey(null)}
          >
            <CloseOutlined />
          </button>
          <div
            className="mx-auto w-full max-w-[360px] overflow-visible text-white"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-5 text-center">
              <p className="text-[12px] font-semibold text-[#ffd54f]">{activeBadge.kind === 'tiered' ? '阶梯成就' : '荣誉勋章'}</p>
              <h2 className="mt-1 text-[20px] font-extrabold leading-tight">{activeBadge.name}</h2>
            </div>

            {activeBadge.kind === 'tiered' ? (
              <>
                <div
                  ref={detailTrackRef}
                  className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [-ms-overflow-style:none] [scrollbar-width:none]"
                  onScroll={handleDetailScroll}
                  onWheel={handleDetailWheel}
                >
                  {activeBadge.levels.map((levelItem) => (
                    <div key={levelItem.id} className="min-w-full snap-center px-1 pt-3">
                      <div className="mx-auto w-full max-w-[320px] px-1 pb-2 pt-2 text-center">
                        <div
                          className={clsx(
                            'relative mx-auto mb-5 flex h-[210px] w-full items-center justify-center pt-2',
                            levelItem.owned ? 'opacity-100' : 'opacity-55',
                          )}
                        >
                          <img
                            alt={levelItem.name}
                            className={clsx('h-[190px] w-[190px] object-contain', levelItem.owned ? 'grayscale-0 saturate-100' : 'grayscale')}
                            src={activeBadge.icon}
                            style={{ filter: levelItem.owned ? getTierDropShadow(levelItem.tier) : undefined }}
                          />
                          <span
                            className={clsx(
                              'absolute right-8 top-5 flex h-7 w-7 items-center justify-center rounded-full text-[13px]',
                              levelItem.owned ? 'bg-[#ffd54f] text-[#4b3310]' : 'bg-black/50 text-[#aaa]',
                            )}
                          >
                            {levelItem.owned ? <CheckCircleFilled /> : <LockFilled />}
                          </span>
                        </div>
                        <p className="text-[15px] font-bold leading-tight">{levelItem.name}</p>
                        <p className="mt-1 text-[12px] font-semibold text-[#ffd54f]">{`Lv.${levelItem.tier} · ${getTierLabel(levelItem.tier)}`}</p>
                        <p className="mt-2 min-h-[34px] text-[12px] leading-relaxed text-[#bbb]">{levelItem.description}</p>
                        <p className={clsx('mt-3 text-[11px] font-semibold', levelItem.owned ? 'text-[#ffd54f]' : 'text-[#888]')}>
                          {getLevelStatusText(levelItem)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between py-4">
                  <button
                    aria-label="查看上一等级"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[13px] disabled:opacity-35"
                    disabled={detailIndex <= 0}
                    type="button"
                    onClick={() => scrollDetail(-1)}
                  >
                    <LeftOutlined />
                  </button>
                  <div className="flex items-center gap-1.5">
                    {activeBadge.levels.map((levelItem, index) => (
                      <span
                        key={levelItem.id}
                        className={clsx('h-1.5 rounded-full transition-all', index === detailIndex ? 'w-5 bg-[#ffd54f]' : 'w-1.5 bg-white/25')}
                      />
                    ))}
                  </div>
                  <button
                    aria-label="查看下一等级"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-[13px] disabled:opacity-35"
                    disabled={detailIndex >= activeBadge.levels.length - 1}
                    type="button"
                    onClick={() => scrollDetail(1)}
                  >
                    <RightOutlined />
                  </button>
                </div>

                <div className="mx-auto w-full max-w-[320px] px-1 pb-5 pt-3">
                  {activeTierProgress ? (
                    <>
                      <div className="mb-2 grid grid-cols-[minmax(0,1fr)_minmax(96px,auto)] items-center gap-3 text-[12px]">
                        <span className="min-w-0 truncate">{activeTierProgress.title}</span>
                        <span className="text-right font-semibold tabular-nums text-[#ffd54f]">{activeTierProgress.text}</span>
                      </div>
                      <div className="h-2 overflow-hidden rounded bg-black">
                        <div className="h-full bg-gradient-to-r from-[#ffd54f] to-[#ffa000]" style={{ width: `${activeTierProgress.percent}%` }} />
                      </div>
                      <p className="mt-2 text-[11px] text-[#999]">{`${activeBadge.statLabel} ${activeBadge.currentValue} ${activeBadge.unit}`}</p>
                    </>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="mx-auto w-full max-w-[320px] px-1 pb-2 pt-1 text-center">
                <div
                  className={clsx(
                    'relative mx-auto mb-5 flex h-[210px] w-full items-center justify-center',
                    activeBadge.unlocked ? 'opacity-100' : 'opacity-55',
                  )}
                >
                  <img
                    alt={activeBadge.name}
                    className={clsx('h-[190px] w-[190px] object-contain', activeBadge.unlocked ? 'grayscale-0 saturate-100' : 'grayscale')}
                    src={activeBadge.icon}
                  />
                  <span
                    className={clsx(
                      'absolute right-8 top-5 flex h-7 w-7 items-center justify-center rounded-full text-[13px]',
                      activeBadge.unlocked ? 'bg-[#ffd54f] text-[#4b3310]' : 'bg-black/50 text-[#aaa]',
                    )}
                  >
                    {activeBadge.unlocked ? <CheckCircleFilled /> : <LockFilled />}
                  </span>
                </div>
                <p className="text-[18px] font-bold leading-tight">{activeBadge.name}</p>
                <p className="mt-2 text-[12px] text-[#bbb]">{activeBadge.desc}</p>
                <div className="mt-5">
                  <div className="mb-2 flex items-center justify-between text-[12px]">
                    <span>{activeBadge.unlocked ? '已点亮' : '点亮进度'}</span>
                    <span className="font-semibold text-[#ffd54f]">{activeBadge.progressText}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded bg-black">
                    <div className="h-full bg-gradient-to-r from-[#ffd54f] to-[#ffa000]" style={{ width: `${activeBadge.progressPercent}%` }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  )
}
