import {
  ExclamationCircleOutlined,
  PlusOutlined,
  RightOutlined,
} from '@ant-design/icons'
import { NotificationOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { getAdminDashboardStats, getAdminNewCats } from '@/api/endpoints/admin'
import { getAdminAdoptions } from '@/api/endpoints/adoptions'
import { getAdminSos } from '@/api/endpoints/sos'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asArray, asRecord, asString, toPaged } from '@/utils/format'

const campusCodeToLabelMap: Record<string, string> = {
  '0': '中心校区',
  '1': '趵突泉校区',
  '2': '洪家楼校区',
  '3': '千佛山校区',
  '4': '兴隆山校区',
  '5': '软件园校区',
  '6': '青岛校区',
  '7': '威海校区',
}

const pendingAdoptionStatus = 'PENDING' as const

function firstNumber(...values: unknown[]): number {
  for (const value of values) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return 0
}

function firstPresent(...values: unknown[]): unknown {
  return values.find((value) => {
    if (value === null || value === undefined) return false
    return typeof value !== 'string' || value.trim().length > 0
  })
}

function normalizeCampusName(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) return campusCodeToLabelMap[String(value)] ?? String(value)

  const record = asRecord(value)
  if (Object.keys(record).length > 0) {
    return normalizeCampusName(record.campusName || record.label || record.name || record.title || record.code || record.id || record.value)
  }

  const campus = asString(value).trim()
  if (!campus) return '未知校区'
  const upperCampus = campus.toUpperCase()
  const enumToCodeMap: Record<string, string> = {
    CENTRAL: '0',
    BAOTUQUAN: '1',
    HONGJIALOU: '2',
    QIANFOSHAN: '3',
    XINGLONGSHAN: '4',
    SOFTWARE_PARK: '5',
    QINGDAO: '6',
    WEIHAI: '7',
  }

  return campusCodeToLabelMap[campus] ?? campusCodeToLabelMap[enumToCodeMap[upperCampus]] ?? campus
}

export function AdminHomePage() {
  usePageTitle('管理员工作台')
  const query = useQuery({ queryKey: ['admin-dashboard'], queryFn: getAdminDashboardStats })
  const pendingSosQuery = useQuery({
    queryKey: ['admin-sos', 'dashboard-count', 'PENDING'],
    queryFn: () => getAdminSos({ status: 'PENDING', page: 1, size: 500 }),
  })
  const pendingAdoptionsQuery = useQuery({
    queryKey: ['admin-adoptions', 'dashboard-count', pendingAdoptionStatus],
    queryFn: () =>
      getAdminAdoptions({
        status: pendingAdoptionStatus,
        page: 1,
        size: 500,
      }),
  })
  const pendingNewCatsQuery = useQuery({
    queryKey: ['admin-new-cats', 'dashboard-count', 'PENDING'],
    queryFn: () => getAdminNewCats({ status: 'PENDING', page: 1, pageSize: 500 }),
  })
  const data = asRecord(query.data?.data)
  const pendingAdoptionsPage = toPaged<Record<string, unknown>>(pendingAdoptionsQuery.data?.data)
  const dashboardAdoptionCount = firstNumber(
    data.pendingAdoptions,
    data.pendingAdoptionApplications,
    data.pendingApplicationCount,
    data.pendingApplications,
    data.pendingAdoptionsCount,
    data.pendingAdoptApplications,
    data.adoptApplicationsPending,
  )
  const pendingSosPage = toPaged<Record<string, unknown>>(pendingSosQuery.data?.data)
  const dashboardSosPendingCount = firstNumber(data.pendingSOS, data.pendingSos, data.sosPending)
  const pendingNewCatsPage = toPaged<Record<string, unknown>>(pendingNewCatsQuery.data?.data)
  const dashboardNewCatsPendingCount = firstNumber(data.pendingNewCats, data.newCatPending, data.newCatsPending, data.auditPending, data.pendingAudit)

  const stats = {
    sosPending: pendingSosQuery.isSuccess ? pendingSosPage.total : dashboardSosPendingCount,
    auditPending: pendingNewCatsQuery.isSuccess ? pendingNewCatsPage.total : dashboardNewCatsPendingCount,
    adoptions: pendingAdoptionsQuery.isSuccess ? pendingAdoptionsPage.total : dashboardAdoptionCount,
    catsTotal: firstNumber(data.totalCats, data.catsTotal),
  }
  const campusDistribution = asArray<unknown>(data.campusDistribution || data.campusStats || data.distribution)
    .map((item) => {
      const row = asRecord(item)
      const count = firstNumber(row.count, row.total, row.value)
      const percentage = firstNumber(row.percentage, row.percent, stats.catsTotal > 0 ? (count / stats.catsTotal) * 100 : 0)
      return {
        name: normalizeCampusName(
          firstPresent(row.campusName, row.campusLabel, row.label, row.name, row.title, row.campus, row.campusCode, row.campusId, row.code, row.key),
        ),
        count,
        percentage: Math.max(0, Math.min(100, percentage)),
      }
    })
    .filter((item) => item.count > 0 || item.percentage > 0)

  const dateText = new Date().toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  return (
    <div className="pb-8">
      <section className="mb-5 rounded-b-[30px] bg-gradient-to-br from-[#fff8e1] to-white px-5 pb-6 pt-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-[22px] font-bold text-[#2c3e50]">下午好，管理员</h1>
            <p className="mt-1 text-[13px] text-[#7f8c8d]">今天是 {dateText}</p>
          </div>
          <Link
            aria-label="公告管理"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-[18px] text-[#0f172a] shadow-[0_4px_12px_rgba(15,23,42,0.08)] active:scale-95"
            to="/admin/announcements"
          >
            <NotificationOutlined />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link
            className="flex items-center justify-center gap-2 rounded-2xl bg-white py-3 text-[13px] font-semibold text-[#2c3e50] shadow-[0_4px_15px_rgba(0,0,0,0.05)]"
            to="/admin/cats/new/edit"
          >
            <PlusOutlined />
            新增档案
          </Link>
          <Link
            className="flex items-center justify-center gap-2 rounded-2xl bg-white py-3 text-[13px] font-semibold text-[#2c3e50] shadow-[0_4px_15px_rgba(0,0,0,0.05)]"
            to="/admin/sos"
          >
            <ExclamationCircleOutlined className="text-[#ff5252]" />
            SOS 待办
          </Link>
        </div>
      </section>

      <div className="h5-content pt-0">
        <QueryState error={query.error} isLoading={query.isLoading}>
          <div className="mb-5 grid grid-cols-2 gap-3">
            {[
              {
                icon: '🆘',
                value: stats.sosPending,
                label: 'SOS 待处理',
                iconBg: 'bg-[#ffebee] text-[#ff5252]',
                to: '/admin/sos',
              },
              {
                icon: '📋',
                value: stats.auditPending,
                label: '新猫审核',
                iconBg: 'bg-[#fff8e1] text-[#ffa726]',
                to: '/admin/new-cats',
              },
              {
                icon: '🏠',
                value: stats.adoptions,
                label: '领养申请',
                iconBg: 'bg-[#80cbc4] text-[#00695c]',
                cardBg: 'bg-gradient-to-br from-[#e0f2f1] to-[#b2dfdb]',
                to: '/admin/adoptions',
              },
              {
                icon: '🐾',
                value: stats.catsTotal,
                label: '猫咪总数',
                iconBg: 'bg-[#e8f5e9] text-[#66bb6a]',
                to: '/admin/cats',
              },
            ].map((item) => {
              const cardClass = `rounded-[20px] border border-black/[0.01] p-4 shadow-[0_8px_20px_rgba(0,0,0,0.04)] ${item.cardBg ?? 'bg-white'}`
              const content = (
                <>
                  <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-[14px] text-[18px] ${item.iconBg}`}>
                    {item.icon}
                  </div>
                  <p className="text-[26px] font-extrabold leading-none text-[#2c3e50]">{item.value}</p>
                  <p className="mt-1 text-[12px] text-[#7f8c8d]">{item.label}</p>
                </>
              )

              if (item.to) {
                return (
                  <Link key={item.label} className={cardClass} to={item.to}>
                    {content}
                  </Link>
                )
              }

              return (
                <div key={item.label} className={cardClass}>
                  {content}
                </div>
              )
            })}
          </div>
        </QueryState>

        <section className="mb-6">
          <h2 className="mb-3 px-1 text-[18px] font-bold text-[#2c3e50]">官方公告管理</h2>
          <Link
            className="flex items-center gap-4 rounded-[20px] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(0,0,0,0.04)]"
            to="/admin/announcements/new/edit"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#f1f5f9] text-[24px] text-[#0f172a]">
              <NotificationOutlined />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-extrabold text-[#2c3e50]">发布新公告</span>
              <span className="mt-0.5 block truncate text-[12px] text-[#94a3b8]">向全校用户推送最新通知或招募信息</span>
            </span>
            <RightOutlined className="shrink-0 text-[20px] text-[#0f172a]" />
          </Link>
        </section>

        <h2 className="mb-3 flex items-center gap-2 px-1 text-[18px] font-bold text-[#2c3e50]">猫咪分布概览</h2>
        <div className="rounded-[16px] bg-white p-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)]">
          {campusDistribution.length ? (
            campusDistribution.map((item, index) => (
              <div key={item.name} className={index === campusDistribution.length - 1 ? '' : 'mb-3'}>
                <div className="mb-1 flex items-center justify-between text-[13px]">
                  <span className="text-[#7f8c8d]">{item.name}</span>
                  <span className="font-bold text-[#2c3e50]">{`${Math.round(item.percentage)}%`}</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-[#f1f5f9]">
                  <div className="h-full rounded-full bg-[#66bb6a]" style={{ width: `${item.percentage}%` }} />
                </div>
              </div>
            ))
          ) : (
            <p className="py-4 text-center text-[13px] text-[#94a3b8]">暂无校区分布数据</p>
          )}
        </div>

        <Link
          className="fixed bottom-24 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-[#ffd54f] text-[22px] text-[#5d4037] shadow-[0_8px_25px_rgba(255,213,79,0.5)]"
          to="/admin/cats/new/edit"
        >
          <PlusOutlined />
        </Link>
      </div>
    </div>
  )
}
