import {
  ArrowLeftOutlined,
  EllipsisOutlined,
  IdcardOutlined,
  SafetyOutlined,
  UserDeleteOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button, message } from 'antd'
import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { banAdminUser, getAdminUserDetail } from '@/api/endpoints/admin'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asNumber, asRecord, asString } from '@/utils/format'

type UserDetail = {
  id: string
  name: string
  avatar: string
  level: number
  department: string
  grade: string
  studentNo: string
  createdAt: string
  role: string
  permission: string
  status: 'active' | 'banned'
  feedCount: number
  reportCount: number
  likeCount: number
}

const fallbackDetail: UserDetail = {
  id: '1',
  name: '爱吃鱼的猫',
  avatar: '',
  level: 3,
  department: '软件园校区',
  grade: '2022级',
  studentNo: '202200301234',
  createdAt: '2024-03-15',
  role: '普通用户',
  permission: '',
  status: 'active',
  feedCount: 32,
  reportCount: 5,
  likeCount: 128,
}

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
  if (typeof value === 'number' && Number.isFinite(value)) return campusCodeLabelMap[String(value)] ?? String(value)

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) return ''
    return campusCodeLabelMap[trimmed] ?? trimmed
  }

  return ''
}

function inferGrade(gradeRaw: string, sidRaw: string): string {
  if (gradeRaw) return gradeRaw
  const sidPrefix = sidRaw.match(/^\d{4}/)?.[0]
  return sidPrefix ? `${sidPrefix}级` : '--'
}

function normalizeId(value: unknown, fallback: string): string {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'string' && value.trim()) return value
  return fallback
}

function normalizePermission(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === 'number' && Number.isFinite(item)) return String(item)
        if (typeof item === 'string') return item.trim()
        return ''
      })
      .filter(Boolean)
      .join(', ')
  }

  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'string') return value.trim()
  return ''
}

function resolveRoleByPermission(permissionRaw: string, fallbackRoleRaw: string): string {
  const permission = permissionRaw.toLowerCase()
  const fallbackRole = fallbackRoleRaw.toLowerCase()

  if (permission) {
    if (/^\d+$/.test(permission)) return Number(permission) > 0 ? '管理员' : '普通用户'
    if (permission.includes('admin') || permission.includes('manager') || permission.includes('root') || permission.includes('super')) {
      return '管理员'
    }
    if (permission.includes('user') || permission.includes('student') || permission.includes('normal')) return '普通用户'
    if (permissionRaw.includes('管理员')) return '管理员'
    if (permissionRaw.includes('普通用户')) return '普通用户'
  }

  if (fallbackRole.includes('admin') || fallbackRoleRaw.includes('管理员')) return '管理员'
  if (fallbackRole.includes('user') || fallbackRole.includes('student') || fallbackRoleRaw.includes('普通用户')) return '普通用户'
  return fallbackRoleRaw || fallbackDetail.role
}

function formatPermissionDisplay(role: string, permission: string): string {
  if (!permission) return role
  return permission === role ? role : `${role}（${permission}）`
}

function normalizeUserDetail(payload: unknown, id: string, fallbackStatus: UserDetail['status']): UserDetail {
  const row = asRecord(payload)
  const stats = asRecord(row.stats)
  const sid = asString(row.sid || row.studentId || row.no, fallbackDetail.studentNo)
  const campus = normalizeCampus(row.campus)
  const permission = normalizePermission(row.permission ?? row.permissions)
  const roleRaw = asString(row.roleName || row.role, '')
  const statusRaw = asString(row.status).toUpperCase()
  const isBanned =
    statusRaw === 'BANNED' ||
    statusRaw === 'DISABLED' ||
    row.isBanned === true ||
    row.banned === true ||
    row.disabled === true

  return {
    id: normalizeId(row.id ?? row.uid, id),
    name: asString(row.nickname || row.name, fallbackDetail.name),
    avatar: asString(row.avatar || row.userAvatar || row.headImg || row.headImgUrl, fallbackDetail.avatar),
    level: asNumber(row.level, fallbackDetail.level),
    department: asString(row.department || row.college || campus, fallbackDetail.department),
    grade: inferGrade(asString(row.grade || row.classYear, ''), sid),
    studentNo: sid,
    createdAt: asString(row.createdAt || row.registerTime, fallbackDetail.createdAt),
    role: resolveRoleByPermission(permission, roleRaw),
    permission,
    status: isBanned ? 'banned' : fallbackStatus,
    feedCount: asNumber(row.feedCount ?? stats.feedCount, fallbackDetail.feedCount),
    reportCount: asNumber(row.reportCount ?? stats.found ?? stats.foundNewCatCount, fallbackDetail.reportCount),
    likeCount: asNumber(row.likeCount ?? stats.receivedLikes, fallbackDetail.likeCount),
  }
}

export function AdminUserDetailPage() {
  usePageTitle('用户详细档案')
  const navigate = useNavigate()
  const location = useLocation()
  const { id = '1' } = useParams()
  const stateRecord = asRecord(location.state)
  const stateStatusRaw = asString(stateRecord.userStatus || asRecord(stateRecord.user).status).toUpperCase()
  const stateStatus: UserDetail['status'] = stateStatusRaw === 'BANNED' ? 'banned' : 'active'

  const query = useQuery({ queryKey: ['admin-user', id], queryFn: () => getAdminUserDetail(id) })
  const detail = query.data?.data
    ? normalizeUserDetail(query.data.data, id, stateStatus)
    : {
        ...fallbackDetail,
        id,
        status: stateStatus,
      }
  const [statusOverride, setStatusOverride] = useState<UserDetail['status'] | null>(null)
  const effectiveStatus = statusOverride ?? detail.status
  const isBanned = effectiveStatus === 'banned'

  const disableMutation = useMutation({
    mutationFn: () => banAdminUser(id, { action: 'BAN', reason: 'manual review' }),
    onSuccess: () => {
      message.success('账号状态已更新')
      setStatusOverride((current) => {
        const nextBase = current ?? detail.status
        return nextBase === 'banned' ? 'active' : 'banned'
      })
      query.refetch()
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '操作失败，请稍后再试'),
  })

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-10">
      <section className="mb-3 rounded-b-[24px] bg-white px-5 pb-5 pt-5 shadow-[0_2px_15px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              className="!h-10 !w-10 !border-none !bg-[#f5f5f5] !text-[#7f8c8d]"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
              shape="circle"
              type="text"
            />
            <h1 className="text-[22px] font-extrabold text-[#2c3e50]">用户详细档案</h1>
          </div>
          <button className="text-lg text-[#94a3b8]" type="button">
            <EllipsisOutlined />
          </button>
        </div>
      </section>

      <div className="h5-content pt-0">
        <QueryState error={query.error} isLoading={query.isLoading}>
          <div className="mb-4 rounded-[24px] border border-black/[0.02] bg-white px-5 pb-6 pt-7 text-center shadow-[0_4px_15px_rgba(0,0,0,0.01)]">
            <div className="mx-auto mb-4 h-[100px] w-[100px] overflow-hidden rounded-full border-4 border-[#f8fafc] bg-gradient-to-br from-[#d1d5db] to-[#94a3b8] shadow-[0_10px_25px_rgba(0,0,0,0.05)]">
              {detail.avatar ? <img alt={detail.name} className="h-full w-full object-cover" src={detail.avatar} /> : null}
            </div>

            <div className="mb-1 flex items-center justify-center gap-2">
              <h2 className="text-[24px] font-black text-[#2c3e50]">{detail.name}</h2>
              <span className="rounded-lg bg-[#fff8e1] px-2 py-1 text-[11px] font-bold text-[#ffa000]">Lv.{detail.level}</span>
            </div>
            <p className="text-[13px] text-[#94a3b8]">
              {detail.department} · {detail.grade}
            </p>

            <div className="mt-7 grid grid-cols-3 gap-3 px-2">
              {[
                [detail.feedCount, '提供投喂'],
                [detail.reportCount, '发现猫咪'],
                [detail.likeCount, '获赞总数'],
              ].map(([value, label]) => (
                <div key={String(label)} className="text-center">
                  <span className="block text-[20px] font-extrabold text-[#2c3e50]">{value}</span>
                  <span className="mt-1 block text-[11px] text-[#7f8c8d]">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4 rounded-[24px] border border-black/[0.02] bg-white p-5 shadow-[0_4px_15px_rgba(0,0,0,0.01)]">
            <h3 className="mb-3 flex items-center gap-2 text-[15px] font-extrabold text-[#2c3e50]">
              <IdcardOutlined className="text-[#ffd54f]" />
              账号基本信息
            </h3>

            <div className="divide-y divide-[#f1f5f9]">
              <div className="flex items-center justify-between py-3 text-[14px]">
                <span className="text-[#7f8c8d]">学号 / 工号</span>
                <span className="font-bold text-[#2c3e50]">{detail.studentNo}</span>
              </div>
              <div className="flex items-center justify-between py-3 text-[14px]">
                <span className="text-[#7f8c8d]">注册时间</span>
                <span className="font-bold text-[#2c3e50]">{detail.createdAt}</span>
              </div>
              <div className="flex items-center justify-between py-3 text-[14px]">
                <span className="text-[#7f8c8d]">账号权限</span>
                <span className="font-bold text-[#2c3e50]">{formatPermissionDisplay(detail.role, detail.permission)}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-black/[0.02] bg-white p-5 shadow-[0_4px_15px_rgba(0,0,0,0.01)]">
            <h3 className="mb-3 flex items-center gap-2 text-[15px] font-extrabold text-[#2c3e50]">
              <SafetyOutlined className="text-[#ffd54f]" />
              管理员操作
            </h3>

            <button
              className="mb-3 flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#f1f5f9] text-[14px] font-bold text-[#475569]"
              onClick={() => message.success('已发送管理员权限申请通知')}
              type="button"
            >
              <UserSwitchOutlined />
              提升为管理员权限
            </button>

            <button
              className={`flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl border text-[14px] font-bold ${
                isBanned
                  ? 'border-[#86efac] bg-[#dcfce7] text-[#15803d]'
                  : 'border-[#fecdd3] bg-[#fff1f2] text-[#e11d48]'
              }`}
              onClick={() => disableMutation.mutate()}
              type="button"
            >
              <UserDeleteOutlined />
              {disableMutation.isPending ? '处理中...' : isBanned ? '解封此账号' : '禁用此账号'}
            </button>
          </div>
        </QueryState>
      </div>
    </div>
  )
}
