import { PlusOutlined, RightOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Card, Progress } from 'antd'
import { Link } from 'react-router-dom'

import { getAdminDashboardStats } from '@/api/endpoints/admin'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'

export function AdminHomePage() {
  usePageTitle('管理员首页')
  const query = useQuery({ queryKey: ['admin-dashboard'], queryFn: getAdminDashboardStats })

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-[#f3f4f6] px-5 pb-24 pt-4">
      <section className="mb-4 rounded-[28px] bg-[#f5f2dd] p-5">
        <div className="mb-4 flex items-start justify-between">
          <div>
            <p className="text-5xl font-black text-[#202937]">下午好，管理员</p>
            <p className="mt-1 text-lg text-[#8a93a0]">今天是 1 月 22 日星期四</p>
          </div>
          <div className="h-12 w-12 rounded-full bg-slate-300" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <button className="rounded-2xl bg-white py-3 text-xl font-bold">新增档案</button>
          <button className="rounded-2xl bg-white py-3 text-xl font-bold">SOS 待办（2）</button>
        </div>
      </section>

      <QueryState error={query.error} isLoading={query.isLoading}>
        <div className="mb-5 grid grid-cols-2 gap-3">
          {[
            ['2', 'SOS 待处理', '2 新增', 'bg-white'],
            ['15', '待审核', '5 新增', 'bg-white'],
            ['8', '领养申请', '持平', 'bg-[#d8eff0]'],
            ['363', '猫咪总数', '+3 本周', 'bg-white'],
          ].map(([value, label, sub, cls]) => (
            <Card key={label} className={`!rounded-3xl !border-none ${cls}`}>
              <p className="text-6xl font-black text-[#293447]">{value}</p>
              <p className="mt-1 text-xl text-[#6b7280]">{label}</p>
              <p className="mt-2 text-base text-[#ef4444]">{sub}</p>
            </Card>
          ))}
        </div>
      </QueryState>

      <h3 className="mb-3 text-4xl font-black">官方公告管理</h3>
      <Link className="mb-4 flex items-center rounded-3xl bg-white p-4 shadow-sm" to="/admin/announcements">
        <div className="mr-3 rounded-xl bg-[#ebf0f7] p-3 text-2xl">📢</div>
        <div className="flex-1">
          <p className="text-3xl font-black">发布新公告</p>
          <p className="text-sm text-[#8f98a8]">向全校用户推送最新通知或招募信息</p>
        </div>
        <RightOutlined />
      </Link>

      <h3 className="mb-3 text-4xl font-black">科普文章管理</h3>
      <Link className="mb-4 flex items-center rounded-3xl bg-white p-4 shadow-sm" to="/admin/articles">
        <div className="mr-3 rounded-xl bg-[#d9f4e8] p-3 text-2xl">📄</div>
        <div className="flex-1">
          <p className="text-3xl font-black">发布科普文章</p>
          <p className="text-sm text-[#8f98a8]">分享养猫知识和猫咪健康护理指南</p>
        </div>
        <RightOutlined />
      </Link>

      <h3 className="mb-3 text-4xl font-black">猫咪分布概览</h3>
      <Card className="!rounded-3xl !border-none">
        {[
          ['软件园校区', 39, '#63b06b'],
          ['中心校区', 27, '#f4cc45'],
          ['其他校区', 34, '#606c80'],
        ].map(([campus, percent, color]) => (
          <div key={String(campus)} className="mb-3 last:mb-0">
            <div className="mb-1 flex justify-between text-sm">
              <span>{campus}</span>
              <span>{percent}%</span>
            </div>
            <Progress percent={Number(percent)} showInfo={false} size={[0, 8]} strokeColor={String(color)} />
          </div>
        ))}
      </Card>

      <Link className="fixed bottom-24 right-6 flex h-12 w-12 items-center justify-center rounded-full bg-[#16b87d] text-white shadow-lg" to="/admin/cats">
        <PlusOutlined />
      </Link>
    </div>
  )
}
