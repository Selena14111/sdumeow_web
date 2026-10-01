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
import { normalizeMediaUrl } from '@/utils/media'

type UserFilter = 'all' | 'admin' | 'user'
type UserRole = 'admin' | 'user' | 'unknown'

type AdminUserItem = {
  id: string
  name: string
  avatar: string
  department: string
  grade: string
  level: number
  role: UserRole
  status: 'active' | 'banned'
  isNew: boolean
}

const filterList: Array<{ key: UserFilter; label: string }> = [
  { key: 'all', label: '全部用户' },
  { key: 'admin', label: '管理员' },
  { key: 'user', label: '普通用户' },
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

function normalizeLevel(...values: unknown[]): number {
  for (const value of values) {
    const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN
    if (Number.isFinite(parsed) && parsed >= 0) return parsed
  }
  return 0
}

function firstPresent(...values: unknown[]): unknown {
  return values.find((value) => {
    if (value === null || value === undefined) return false
    return typeof value !== 'string' || value.trim().length > 0
  })
}

function normalizePermission(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'number' && Number.isFinite(item)) return String(item)
        if (typeof item === 'string') return item.trim()

        const row = asRecord(item)
        return asString(row.name || row.role || row.authority || row.permission || row.value, '').trim()
      })
      .filter(Boolean)
      .join(', ')
  }

  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'string') return value.trim()
  return ''
}

function toOptionalBoolean(value: unknown): boolean | null {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number' && Number.isFinite(value)) return value !== 0
  if (typeof value !== 'string') return null

  const normalized = value.trim().toLowerCase()
  if (!normalized) return null
  if (['true', '1', 'yes', 'y', 'admin'].includes(normalized)) return true
  if (['false', '0', 'no', 'n', 'user', 'normal'].includes(normalized)) return false
  return null
}

function resolveUserRole(permissionRaw: string, roleRaw: string, adminFlag: boolean | null): UserRole {
  if (adminFlag === true) return 'admin'

  const permission = permissionRaw.toLowerCase()
  const role = roleRaw.toLowerCase()
  const combinedRaw = `${permissionRaw} ${roleRaw}`
  const combined = combinedRaw.toLowerCase()

  if (
    combined.includes('admin') ||
    combined.includes('manager') ||
    combined.includes('root') ||
    combined.includes('super') ||
    combinedRaw.includes('管理员')
  ) {
    return 'admin'
  }
  if (
    combined.includes('user') ||
    combined.includes('student') ||
    combined.includes('normal') ||
    combinedRaw.includes('普通用户')
  ) {
    return 'user'
  }
  if (/^\d+$/.test(permission)) return Number(permission) > 0 ? 'admin' : 'user'
  if (/^\d+$/.test(role)) return Number(role) > 0 ? 'admin' : 'user'
  if (adminFlag === false) return 'user'

  return 'unknown'
}

function normalizeUserRole(row: Record<string, unknown>): UserRole {
  const profile = asRecord(row.profile)
  const userInfo = asRecord(row.userInfo)
  const permission = normalizePermission(
    firstPresent(
      row.permission,
      row.permissions,
      row.auth,
      row.authority,
      row.authorities,
      row.permissionLevel,
      profile.permission,
      profile.permissions,
      userInfo.permission,
      userInfo.permissions,
    ),
  )
  const roleRaw = normalizePermission(
    firstPresent(
      row.roleName,
      row.role,
      row.userRole,
      row.userType,
      row.accountRole,
      profile.roleName,
      profile.role,
      userInfo.roleName,
      userInfo.role,
    ),
  )
  const adminFlag = toOptionalBoolean(
    firstPresent(
      row.isAdmin,
      row.admin,
      row.adminFlag,
      row.isManager,
      row.manager,
      row.superAdmin,
      profile.isAdmin,
      userInfo.isAdmin,
    ),
  )

  return resolveUserRole(permission, roleRaw, adminFlag)
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
      level: normalizeLevel(row.level, profile.level, userInfo.level, row.lv),
      role: normalizeUserRole(row),
      status: statusRaw === 'BANNED' || statusRaw === 'DISABLED' ? 'banned' : 'active',
      isNew: Boolean(row.isNew),
    }
  })
}

function applyFilter(users: AdminUserItem[], filter: UserFilter) {
  if (filter === 'all') return users
  if (filter === 'admin') return users.filter((user) => user.role === 'admin')
  return users.filter((user) => user.role !== 'admin')
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

function extractLevelFromDetail(payload: unknown): number {
  const row = asRecord(payload)
  const profile = asRecord(row.profile)
  const userInfo = asRecord(row.userInfo)
  return normalizeLevel(row.level, profile.level, userInfo.level, row.lv)
}

function extractRoleFromDetail(payload: unknown): UserRole {
  return normalizeUserRole(asRecord(payload))
}

type UserAvatarProps = {
  name: string
  avatar: string
}

function UserAvatar({ name, avatar }: UserAvatarProps) {
  const avatarUrl = normalizeMediaUrl(avatar)
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
  const users = useMemo(() => normalizeUsers(query.data?.data), [query.data?.data])

  const preliminaryFilteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    const base = applyFilter(users, activeFilter)

    if (!keyword) return base
    return base.filter((item) => {
      const target = `${item.name}${item.department}${item.grade}`.toLowerCase()
      return target.includes(keyword)
    })
  }, [activeFilter, search, users])

  const roleUnknownIds = useMemo(() => users.filter((user) => user.role === 'unknown').map((user) => user.id), [users])

  const enrichUserIds = useMemo(
    () =>
      Array.from(
        new Set([
          ...roleUnknownIds,
          ...preliminaryFilteredUsers.filter((user) => !user.avatar.trim() || user.level <= 0).map((user) => user.id),
        ]),
      ),
    [preliminaryFilteredUsers, roleUnknownIds],
  )

  const detailQueries = useQueries({
    queries: enrichUserIds.map((userId) => ({
      queryKey: ['admin-user', userId, 'summary'],
      queryFn: () => getAdminUserDetail(userId),
      staleTime: 5 * 60 * 1000,
    })),
  })

  const detailPatchById = useMemo(() => {
    const map = new Map<string, { avatar: string; level: number; role: UserRole }>()
    enrichUserIds.forEach((userId, index) => {
      const payload = detailQueries[index]?.data?.data
      const avatar = extractAvatarFromDetail(payload)
      const level = extractLevelFromDetail(payload)
      const role = extractRoleFromDetail(payload)
      map.set(userId, { avatar, level, role })
    })
    return map
  }, [detailQueries, enrichUserIds])

  const enrichedUsers = useMemo(
    () =>
      users.map((user) => ({
        ...user,
        avatar: user.avatar || detailPatchById.get(user.id)?.avatar || '',
        level: user.level > 0 ? user.level : detailPatchById.get(user.id)?.level || 0,
        role: user.role === 'unknown' ? detailPatchById.get(user.id)?.role ?? user.role : user.role,
      })),
    [detailPatchById, users],
  )

  const filteredUsers = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    const base = applyFilter(enrichedUsers, activeFilter)

    if (!keyword) return base
    return base.filter((item) => {
      const roleText = item.role === 'admin' ? '管理员' : '普通用户'
      const target = `${item.name}${item.department}${item.grade}${roleText}`.toLowerCase()
      return target.includes(keyword)
    })
  }, [activeFilter, enrichedUsers, search])

  const displayedUsers = filteredUsers
  const pendingRoleIds = new Set(roleUnknownIds)
  const isResolvingAdminRoles =
    activeFilter === 'admin' &&
    detailQueries.some((detailQuery, index) => pendingRoleIds.has(enrichUserIds[index]) && detailQuery.isLoading)

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
          isLoading={query.isLoading || isResolvingAdminRoles}
          emptyDescription="暂无符合条件的用户"
        >
          <div className="space-y-3">
            {displayedUsers.map((user) => {
              const roleLabel = user.role === 'admin' ? '管理员' : '普通用户'

              return (
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
                      <div className="flex flex-shrink-0 items-center gap-1.5">
                        <span
                          className={clsx(
                            'rounded-lg px-2 py-0.5 text-[10px] font-bold',
                            user.role === 'admin' ? 'bg-[#fff8e1] text-[#ffa000]' : 'bg-[#f1f5f9] text-[#64748b]',
                          )}
                        >
                          {roleLabel}
                        </span>
                        <span className="rounded-lg bg-[#fff8e1] px-2 py-0.5 text-[10px] font-bold text-[#ffa000]">
                          Lv.{user.level}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f1f5f9] text-[#64748b]">
                    <RightOutlined />
                  </div>
                </Link>
              )
            })}
          </div>
        </QueryState>
      </div>
    </div>
  )
}
