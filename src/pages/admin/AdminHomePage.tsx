import {
  ArrowUpOutlined,
  BookOutlined,
  ExclamationCircleOutlined,
  NotificationOutlined,
  PlusOutlined,
  RightOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { getAdminDashboardStats } from '@/api/endpoints/admin'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asNumber, asRecord } from '@/utils/format'

const fallbackStats = {
  sosPending: 2,
  auditPending: 15,
  adoptions: 8,
  catsTotal: 363,
}

export function AdminHomePage() {
  usePageTitle('管理员工作台')
  const query = useQuery({ queryKey: ['admin-dashboard'], queryFn: getAdminDashboardStats })
  const data = asRecord(query.data?.data)

  const stats = {
    sosPending: asNumber(data.sosPending, fallbackStats.sosPending),
    auditPending: asNumber(data.auditPending, fallbackStats.auditPending),
    adoptions: asNumber(data.adoptions, fallbackStats.adoptions),
    catsTotal: asNumber(data.catsTotal, fallbackStats.catsTotal),
  }

  const dateText = new Date().toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  })

  return (
    <div className="pb-8">
      <section className="mb-5 rounded-b-[30px] bg-gradient-to-br from-[#fff8e1] to-white px-5 pb-6 pt-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <h1 className="text-[22px] font-bold text-[#2c3e50]">下午好，管理员</h1>
            <p className="mt-1 text-[13px] text-[#7f8c8d]">今天是 {dateText}</p>
          </div>
          <div className="h-12 w-12 rounded-full border-2 border-white bg-gradient-to-br from-[#d1d5db] to-[#94a3b8]" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Link
            className="flex items-center justify-center gap-2 rounded-2xl bg-white py-3 text-[13px] font-semibold text-[#2c3e50] shadow-[0_4px_15px_rgba(0,0,0,0.05)]"
            to="/admin/cats/1/edit"
          >
            <PlusOutlined />
            新增档案
          </Link>
          <Link
            className="flex items-center justify-center gap-2 rounded-2xl bg-white py-3 text-[13px] font-semibold text-[#2c3e50] shadow-[0_4px_15px_rgba(0,0,0,0.05)]"
            to="/admin/sos"
          >
            <ExclamationCircleOutlined className="text-[#ff5252]" />
            SOS 待办（{stats.sosPending}）
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
                trend: '+2 今日新增',
                trendColor: 'text-[#ff5252]',
                iconBg: 'bg-[#ffebee] text-[#ff5252]',
              },
              {
                icon: '📋',
                value: stats.auditPending,
                label: '待审核申请',
                trend: '+5 今日新增',
                trendColor: 'text-[#66bb6a]',
                iconBg: 'bg-[#fff8e1] text-[#ffa726]',
              },
              {
                icon: '🏠',
                value: stats.adoptions,
                label: '领养申请',
                trend: '环比持平',
                trendColor: 'text-[#7f8c8d]',
                iconBg: 'bg-[#80cbc4] text-[#00695c]',
                cardBg: 'bg-gradient-to-br from-[#e0f2f1] to-[#b2dfdb]',
              },
              {
                icon: '🐾',
                value: stats.catsTotal,
                label: '猫咪总数',
                trend: '+3 本周新增',
                trendColor: 'text-[#66bb6a]',
                iconBg: 'bg-[#e8f5e9] text-[#66bb6a]',
              },
            ].map((item) => (
              <div
                key={item.label}
                className={`rounded-[20px] border border-black/[0.01] p-4 shadow-[0_8px_20px_rgba(0,0,0,0.04)] ${item.cardBg ?? 'bg-white'}`}
              >
                <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-[14px] text-[18px] ${item.iconBg}`}>
                  {item.icon}
                </div>
                <p className="text-[26px] font-extrabold leading-none text-[#2c3e50]">{item.value}</p>
                <p className="mt-1 text-[12px] text-[#7f8c8d]">{item.label}</p>
                <p className={`mt-2 flex items-center gap-1 text-[11px] ${item.trendColor}`}>
                  <ArrowUpOutlined />
                  {item.trend}
                </p>
              </div>
            ))}
          </div>
        </QueryState>

        <h2 className="mb-3 flex items-center gap-2 px-1 text-[18px] font-bold text-[#2c3e50]">
          <NotificationOutlined className="text-[#ffd54f]" />
          官方公告管理
        </h2>
        <Link
          className="mb-5 flex items-center gap-3 rounded-[16px] bg-white p-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)]"
          to="/admin/announcements"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#f1f5f9] text-[20px] text-[#475569]">
            <NotificationOutlined />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-bold text-[#2c3e50]">发布校园公告</p>
            <p className="text-[11px] text-[#7f8c8d]">向全校用户推送最新通知、活动与招募信息</p>
          </div>
          <RightOutlined className="text-[#ddd]" />
        </Link>

        <h2 className="mb-3 flex items-center gap-2 px-1 text-[18px] font-bold text-[#2c3e50]">
          <BookOutlined className="text-[#ffd54f]" />
          科普文章管理
        </h2>
        <Link
          className="mb-5 flex items-center gap-3 rounded-[16px] bg-white p-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)]"
          to="/admin/articles"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#10b981] to-[#059669] text-[20px] text-white">
            <BookOutlined />
          </div>
          <div className="flex-1">
            <p className="text-[14px] font-bold text-[#2c3e50]">发布科普文章</p>
            <p className="text-[11px] text-[#7f8c8d]">分享养猫知识和猫咪健康护理指南</p>
          </div>
          <RightOutlined className="text-[#ddd]" />
        </Link>

        <h2 className="mb-3 flex items-center gap-2 px-1 text-[18px] font-bold text-[#2c3e50]">猫咪分布概览</h2>
        <div className="rounded-[16px] bg-white p-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)]">
          {[
            ['软件园校区', 39, '#66bb6a'],
            ['中心校区', 27, '#ffd54f'],
            ['其他校区', 34, '#475569'],
          ].map(([name, percent, color], index) => (
            <div key={String(name)} className={index === 2 ? '' : 'mb-3'}>
              <div className="mb-1 flex items-center justify-between text-[13px]">
                <span className="text-[#7f8c8d]">{name}</span>
                <span className="font-bold text-[#2c3e50]">{percent}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[#f1f5f9]">
                <div className="h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: String(color) }} />
              </div>
            </div>
          ))}
        </div>

        <Link
          className="fixed bottom-24 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-[#ffd54f] text-[22px] text-[#5d4037] shadow-[0_8px_25px_rgba(255,213,79,0.5)]"
          to="/admin/cats/1/edit"
        >
          <PlusOutlined />
        </Link>
      </div>
    </div>
  )
}
