import { RightOutlined, SearchOutlined, TeamOutlined } from '@ant-design/icons'
import { useQueries, useQuery } from '@tanstack/react-query'
import { Input } from 'antd'
import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { getAdminUserDetail, getAdminUsers } from '@/api/endpoints/admin'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asRecord, asString, toPaged } from '@/utils/format'

type UserFilter = 'all' | 'active' | 'admin' | 'banned' | 'new'

type AdminUserItem = {
  id: string
  name: string
  avatar: string
  department: string
  grade: string
  level: number
  role: 'admin' | 'user'
  status: 'active' | 'banned'
  isNew: boolean
}

const fallbackUsers: AdminUserItem[] = [
  { id: '1', name: '爱吃鱼的猫', avatar: '', department: '软件园校区', grade: '2022级', level: 3, role: 'admin', status: 'active', isNew: false },
  { id: '2', name: '张同学', avatar: '', department: '中心校区', grade: '2021级', level: 5, role: 'user', status: 'active', isNew: false },
  { id: '3', name: '李同学', avatar: '', department: '洪家楼校区', grade: '2020级', level: 2, role: 'user', status: 'active', isNew: false },
  { id: '4', name: '王同学', avatar: '', department: '青岛校区', grade: '2023级', level: 1, role: 'user', status: 'active', isNew: true },
  { id: '5', name: '赵同学', avatar: '', department: '威海校区', grade: '2021级', level: 4, role: 'user', status: 'banned', isNew: false },
  { id: '6', name: '孙同学', avatar: '', department: '趵突泉校区', grade: '2022级', level: 1, role: 'user', status: 'active', isNew: true },
]

const filterList: Array<{ key: UserFilter; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'active', label: '活跃用户' },
  { key: 'admin', label: '管理员' },
  { key: 'banned', label: '已禁用' },
  { key: 'new', label: '新用户' },
]

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
  if (typeof value === 'number' && Number.isFinite(value)) {
    return campusCodeLabelMap[String(value)] ?? String(value)
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return ''
    return campusCodeLabelMap[trimmed] ?? trimmed
  }

  return ''
}

function normalizeId(value: unknown, fallback: string): string {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'string' && value.trim()) return value
  return fallback
}

function inferGrade(gradeRaw: string, sidRaw: string): string {
  if (gradeRaw) return gradeRaw
  const sidPrefix = sidRaw.match(/^\d{4}/)?.[0]
  return sidPrefix ? `${sidPrefix}级` : '--'
}

function normalizeUsers(payload: unknown): AdminUserItem[] {
  const rawItems = Array.isArray(payload) ? payload : toPaged<Record<string, unknown>>(payload).items

  return rawItems.map((item, index) => {
    const row = asRecord(item)
    const profile = asRecord(row.profile)
    const userInfo = asRecord(row.userInfo)
    const sid = asString(row.sid || row.studentId || row.no, '')
    const grade = inferGrade(asString(row.grade || row.classYear, ''), sid)
    const campus = normalizeCampus(row.campus)
    const roleRaw = asString(row.role, '').toLowerCase()
    const roleNameRaw = asString(row.roleName, '').toLowerCase()
    const statusRaw = asString(row.status, '').toUpperCase()

    return {
      id: normalizeId(row.id ?? row.uid, String(index + 1)),
      name: asString(row.nickname || row.name, `用户${index + 1}`),
      avatar: asString(
        row.avatar ||
          row.userAvatar ||
          row.headImg ||
          row.headImgUrl ||
          row.photo ||
          row.portrait ||
          profile.avatar ||
          profile.userAvatar ||
          userInfo.avatar ||
          userInfo.userAvatar,
        '',
      ),
      department: asString(row.department || row.college || campus, '--'),
      grade,
      level: Number(row.level ?? 1),
      role: roleRaw.includes('admin') || roleNameRaw.includes('管理员') ? 'admin' : 'user',
      status: statusRaw === 'BANNED' || statusRaw === 'DISABLED' ? 'banned' : 'active',
      isNew: Boolean(row.isNew),
    }
  })
}

function applyFilter(users: AdminUserItem[], filter: UserFilter) {
  if (filter === 'all') return users
  if (filter === 'active') return users.filter((user) => user.status === 'active')
  if (filter === 'admin') return users.filter((user) => user.role === 'admin')
  if (filter === 'banned') return users.filter((user) => user.status === 'banned')
  return users.filter((user) => user.isNew)
}

function extractAvatarFromDetail(payload: unknown): string {
  const row = asRecord(payload)
  const profile = asRecord(row.profile)
  const userInfo = asRecord(row.userInfo)
  return asString(
    row.avatar ||
      row.userAvatar ||
      row.headImg ||
      row.headImgUrl ||
      row.photo ||
      row.portrait ||
      profile.avatar ||
      profile.userAvatar ||
      userInfo.avatar ||
      userInfo.userAvatar,
    '',
  )
}

type UserAvatarProps = {
  name: string
  avatar: string
}

function normalizeAvatarUrl(rawAvatar: string): string {
  const avatar = rawAvatar.trim()
  if (!avatar) return ''
  if (/^https?:\/\//i.test(avatar) || /^data:/i.test(avatar) || /^blob:/i.test(avatar)) return avatar
  if (avatar.startsWith('//')) return `https:${avatar}`

  const baseUrl = String(import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/+$/, '')
  if (!baseUrl) return avatar
  if (avatar.startsWith('/')) return `${baseUrl}${avatar}`
  return `${baseUrl}/${avatar}`
}

function UserAvatar({ name, avatar }: UserAvatarProps) {
  const avatarUrl = normalizeAvatarUrl(avatar)
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setIsLoaded(false)
    setHasError(false)
  }, [avatarUrl])

  const showPlaceholder = !avatarUrl || hasError || !isLoaded

  return (
    <div
      className={clsx(
        'relative h-[50px] w-[50px] flex-shrink-0 overflow-hidden rounded-full',
        showPlaceholder ? 'bg-gradient-to-br from-[#d1d5db] to-[#94a3b8]' : 'bg-transparent',
      )}
    >
      {avatarUrl ? (
        <img
          alt={name}
          className="absolute inset-0 block h-full w-full object-cover object-center"
          loading="lazy"
          referrerPolicy="no-referrer"
          src={avatarUrl}
          onError={() => setHasError(true)}
          onLoad={() => setIsLoaded(true)}
        />
      ) : null}
    </div>
  )
}

export function AdminUsersPage() {
  usePageTitle('用户管理')
  const [search, setSearch] = useState('')
  const [activeFilter, setActiveFilter] = useState<UserFilter>('all')

  const query = useQuery({ queryKey: ['admin-users'], queryFn: getAdminUsers })
  const users = useMemo(() => {
    const normalized = normalizeUsers(query.data?.data)
    return normalized.length > 0 ? normalized : fallbackUsers
  }, [query.data?.data])

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    const base = applyFilter(users, activeFilter)

    if (!keyword) return base
    return base.filter((item) => {
      const target = `${item.name}${item.department}${item.grade}`.toLowerCase()
      return target.includes(keyword)
    })
  }, [activeFilter, search, users])

  const avatarMissingIds = useMemo(
    () => Array.from(new Set(filteredUsers.filter((user) => !user.avatar.trim()).map((user) => user.id))),
    [filteredUsers],
  )

  const detailAvatarQueries = useQueries({
    queries: avatarMissingIds.map((userId) => ({
      queryKey: ['admin-user', userId, 'avatar'],
      queryFn: () => getAdminUserDetail(userId),
      staleTime: 5 * 60 * 1000,
    })),
  })

  const avatarFromDetailById = useMemo(() => {
    const map = new Map<string, string>()
    avatarMissingIds.forEach((userId, index) => {
      const avatar = extractAvatarFromDetail(detailAvatarQueries[index]?.data?.data)
      if (avatar) map.set(userId, avatar)
    })
    return map
  }, [avatarMissingIds, detailAvatarQueries])

  const displayedUsers = useMemo(
    () =>
      filteredUsers.map((user) => ({
        ...user,
        avatar: user.avatar || avatarFromDetailById.get(user.id) || '',
      })),
    [avatarFromDetailById, filteredUsers],
  )

  const totalCount = users.length
  const weeklyNew = users.filter((user) => user.isNew).length

  return (
    <div className="pb-8">
      <section className="mb-5 rounded-b-[24px] bg-white px-5 pb-5 pt-5 shadow-[0_2px_15px_rgba(0,0,0,0.04)]">
        <h1 className="mb-4 flex items-center gap-2 text-[24px] font-extrabold text-[#2c3e50]">
          <TeamOutlined className="text-[#ffd54f]" />
          用户管理
        </h1>

        <Input
          className="!h-12 !rounded-2xl !border-none !bg-[#f5f5f5]"
          onChange={(event) => setSearch(event.target.value)}
          placeholder="搜索用户名、学号、学院..."
          prefix={<SearchOutlined className="text-[#bdc3c7]" />}
          value={search}
        />
      </section>

      <div className="h5-content pt-0">
        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-gradient-to-br from-[#475569] to-[#1e293b] p-5 text-white">
            <p className="text-[32px] font-black leading-none">{totalCount}</p>
            <p className="mt-1 text-[12px] text-white/90">注册用户</p>
          </div>
          <div className="rounded-2xl bg-gradient-to-br from-[#059669] to-[#10b981] p-5 text-white">
            <p className="text-[32px] font-black leading-none">{weeklyNew}</p>
            <p className="mt-1 text-[12px] text-white/90">本周新增</p>
          </div>
        </div>

        <div className="chip-row mb-4 gap-2 pb-2">
          {filterList.map((filter) => (
            <button
              key={filter.key}
              className={clsx(
                'rounded-full border border-black/5 px-4 py-2 text-[13px] font-medium transition-all',
                activeFilter === filter.key
                  ? 'bg-[#ffd54f] text-[#5d4037] shadow-[0_4px_10px_rgba(255,213,79,0.3)]'
                  : 'bg-white text-[#7f8c8d]',
              )}
              onClick={() => setActiveFilter(filter.key)}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>

        <QueryState
          error={query.error}
          isEmpty={!query.isLoading && !query.error && filteredUsers.length === 0}
          isLoading={query.isLoading}
          emptyDescription="暂无符合条件的用户"
        >
          <div className="space-y-3">
            {displayedUsers.map((user) => (
              <Link
                key={user.id}
                className="flex items-center gap-3 rounded-2xl border border-black/[0.03] bg-white p-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)] transition-transform active:scale-[0.98]"
                state={{ userStatus: user.status }}
                to={`/admin/users/${user.id}`}
              >
                <div className="relative">
                  <UserAvatar avatar={user.avatar} name={user.name} />
                  {user.role === 'admin' ? (
                    <span className="absolute -bottom-1 -right-1 rounded-full bg-[#fff8e1] px-1 text-[10px]">👑</span>
                  ) : null}
                  <span
                    className={clsx(
                      'absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full border-2 border-white',
                      user.status === 'active' ? 'bg-[#66bb6a]' : 'bg-[#ef4444]',
                    )}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="truncate text-[15px] font-bold text-[#2c3e50]">{user.name}</p>
                    <span className="rounded-lg bg-[#fff8e1] px-2 py-0.5 text-[10px] font-bold text-[#ffa000]">
                      Lv.{user.level}
                    </span>
                  </div>
                </div>

                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f1f5f9] text-[#64748b]">
                  <RightOutlined />
                </div>
              </Link>
            ))}
          </div>
        </QueryState>
      </div>
    </div>
  )
}
