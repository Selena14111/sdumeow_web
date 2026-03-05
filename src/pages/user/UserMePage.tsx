import { CrownFilled, EditOutlined, FileTextOutlined, LogoutOutlined, OrderedListOutlined, RightOutlined, TrophyOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Button } from 'antd'
import { Link, useNavigate } from 'react-router-dom'

import { getMyAdoptions } from '@/api/endpoints/adoptions'
import { getMe } from '@/api/endpoints/user'
import { QueryState } from '@/components/feedback/QueryState'
import { useAuth } from '@/hooks/useAuth'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asNumber, asRecord, asString, toPaged } from '@/utils/format'
import { storage } from '@/utils/storage'

const campusCodeLabelMap: Record<string, string> = {
  '0': '中心校区',
  '1': '趵突泉校区',
  '2': '洪家楼校区',
  '3': '千佛山校区',
  '4': '兴隆山校区',
  '5': '软件园校区',
  '6': '青岛校区',
  '7': '威海校区',
}

function normalizeCampus(value: unknown): string {
  if (typeof value === 'number') {
    return campusCodeLabelMap[String(value)] ?? String(value)
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    return campusCodeLabelMap[trimmed] ?? trimmed
  }

  return ''
}

const AUTO_CHECKIN_TOTAL_DAYS_STORAGE_KEY = 'user:auto-checkin:total-days'

function readStoredCheckinTotalDays(): number | null {
  const raw = window.localStorage.getItem(AUTO_CHECKIN_TOTAL_DAYS_STORAGE_KEY)
  if (!raw) return null
  const value = Number(raw)
  if (!Number.isFinite(value) || value < 0) return null
  return Math.floor(value)
}

export function UserMePage() {
  usePageTitle('我的')
  const navigate = useNavigate()
  const { logout } = useAuth()
  const checkinTotalDays = readStoredCheckinTotalDays()
  const query = useQuery({ queryKey: ['me'], queryFn: getMe })
  const myAdoptionsQuery = useQuery({
    queryKey: ['my-adoptions', 'me-summary'],
    queryFn: () =>
      getMyAdoptions({
        page: 1,
        size: 100,
      }),
  })

  const handleLogout = () => {
    storage.clearToken()
    logout()
    navigate('/login', { replace: true })
  }

  const profile = asRecord(query.data?.data)
  const stats = asRecord(profile.stats)
  const campus = normalizeCampus(profile.campus) || '软件园校区'
  const studentId = asString(profile.studentId || profile.sid, '')
  const level = asNumber(profile.level, 3)
  const title = asString(profile.title, '资深铲屎官')
  const feedCount = asNumber(stats.feedCount, 0)
  const foundNewCatCount = asNumber(stats.foundNewCatCount, asNumber(stats.found, 0))
  const receivedLikes = asNumber(stats.receivedLikes, 0)
  const fishPoints = Math.max(0, asNumber(profile.currency, asNumber(stats.fishPoints, asNumber(stats.points, asNumber(stats.score, 0)))))
  const checkinDaysFromProfile = asNumber(stats.totalDays, asNumber(stats.checkinDays, asNumber(stats.checkinCount, -1)))
  const checkinDays = checkinTotalDays ?? (checkinDaysFromProfile >= 0 ? Math.floor(checkinDaysFromProfile) : 0)
  const exp = Math.max(0, asNumber(profile.exp, 0))
  const nextExp = Math.max(0, asNumber(profile.nextExp, 0))
  const levelProgress = nextExp > 0 ? Math.min(100, Math.round((exp / nextExp) * 100)) : 0
  const adoptionItems = toPaged<Record<string, unknown>>(myAdoptionsQuery.data?.data).items
  const applicationCount = adoptionItems.length
  const pendingApplicationCount = adoptionItems.filter((item) => {
    const status = asString(asRecord(item).status, '').toUpperCase()
    return status === 'PENDING' || status === 'PROCESSING' || status === 'INTERVIEW'
  }).length

  const avatar = asString(profile.avatar, '').trim()
  const nickname = asString(profile.nickname, '爱吃鱼的猫')
  const slogan = asString(profile.slogan, `${campus}${studentId ? ` · ${studentId}` : ''}`)
  const displaySlogan = asString(profile.slogan, slogan || 'Welcome back')

  return (
    <QueryState error={query.error} isLoading={query.isLoading}>
      <section className="relative mb-10 rounded-b-[30px] bg-gradient-to-br from-[#ffd54f] to-[#ffb300] px-6 pb-20 pt-5 text-[#5d4037] shadow-[0_10px_20px_rgba(255,179,0,0.22)]">
        <div className="mb-3 flex justify-end">
          <Link
            className="inline-flex items-center gap-1 rounded-full border border-white/50 bg-white/25 px-3 py-1 text-[12px] font-semibold backdrop-blur"
            to="/user/me/edit"
          >
            <EditOutlined />
            编辑资料
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <div className="pr-3">
            <h1 className="text-[26px] font-extrabold leading-tight">{nickname}</h1>
            <p className="mt-1 text-[13px] font-medium" title={slogan}>
              {displaySlogan}
            </p>
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/35 px-2.5 py-1 text-[11px] font-bold" data-level={level}>
              <CrownFilled />
              {`Lv.${level} ${title}`}
            </div>
          </div>
          <div className="h-20 w-20 flex-none overflow-hidden rounded-full border-4 border-white/50 bg-gradient-to-br from-[#d1d5db] to-[#94a3b8]">
            {avatar ? <img alt={nickname} className="h-full w-full object-cover" src={avatar} /> : null}
          </div>
        </div>

        <div className="absolute -bottom-9 left-5 right-5 grid grid-cols-3 rounded-[20px] bg-white px-3 py-4 text-center shadow-[0_15px_35px_rgba(0,0,0,0.08)]">
          {[
            ['累计投喂', feedCount],
            ['发现新猫', foundNewCatCount],
            ['获得点赞', receivedLikes],
          ].map(([label, value]) => (
            <div key={String(label)}>
              <p className="text-[22px] font-extrabold text-[#333]">{value as number}</p>
              <p className="text-[11px] text-[#999]">{label as string}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="h5-content pt-0">
        <h3 className="mb-3 ml-1 text-[13px] text-[#999]">我的资产</h3>
        <div className="relative mb-6 overflow-hidden rounded-[24px] bg-gradient-to-r from-[#424242] to-[#212121] p-5 text-[#ffd54f] shadow-[0_10px_20px_rgba(0,0,0,0.18)]">
          <p className="text-[12px] opacity-80">小鱼干余额（积分）</p>
          <p className="mt-1 text-[36px] font-extrabold leading-none">{fishPoints}</p>
          <p className="mt-2 text-[12px] opacity-80">{`经验 ${exp} / ${nextExp}`}</p>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
            <div className="h-full rounded-full bg-[#ffd54f]" style={{ width: `${levelProgress}%` }} />
          </div>
          <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[11px]">
            {`累计签到 ${checkinDays} 天`}
            <RightOutlined className="text-[10px]" />
          </p>
          <span className="absolute -right-1 bottom-1 text-[56px] opacity-10">🐟</span>
        </div>

        <h3 className="mb-3 ml-1 text-[13px] text-[#999]">我的服务</h3>
        <div className="mb-5 grid grid-cols-2 gap-3">
          <Link className="relative rounded-[20px] bg-white p-4 shadow-[0_8px_18px_rgba(0,0,0,0.06)]" to="/user/adopt/apply">
            <span className="absolute right-3 top-3 rounded-md bg-[#e3f2fd] px-1.5 py-0.5 text-[10px] font-semibold text-[#2196f3]">
              {pendingApplicationCount > 0 ? `审核中 ${pendingApplicationCount}` : '可申请'}
            </span>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffebee] text-[#d32f2f]">
              <FileTextOutlined />
            </div>
            <p className="text-[15px] font-bold text-[#333]">领养申请</p>
            <p className="mt-1 text-[11px] text-[#999]">查看进度</p>
          </Link>

          <Link className="rounded-[20px] bg-white p-4 shadow-[0_8px_18px_rgba(0,0,0,0.06)]" to="/user/rewards">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff8e1] text-[#ffa000]">
              <TrophyOutlined />
            </div>
            <p className="text-[15px] font-bold text-[#333]">荣誉勋章</p>
            <p className="mt-1 text-[11px] text-[#999]">查看勋章墙</p>
          </Link>

          <Link className="relative rounded-[20px] bg-white p-4 shadow-[0_8px_18px_rgba(0,0,0,0.06)]" to="/user/me-center">
            <span className="absolute right-3 top-3 rounded-md bg-[#e3f2fd] px-1.5 py-0.5 text-[10px] font-semibold text-[#2196f3]">{applicationCount}</span>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#e3f2fd] text-[#1976d2]">
              <OrderedListOutlined />
            </div>
            <p className="text-[15px] font-bold text-[#333]">我的申请</p>
            <p className="mt-1 text-[11px] text-[#999]">查看全部记录</p>
          </Link>
        </div>

        <Button
          block
          className="!h-12 !rounded-[15px] !border-none !bg-[#f5f5f5] !text-[14px] !font-semibold !text-[#999]"
          icon={<LogoutOutlined />}
          onClick={handleLogout}
        >
          退出登录
        </Button>
        <p className="mt-4 text-center text-[10px] text-[#ccc]">SDU Meow v2.4</p>
      </div>
    </QueryState>
  )
}
