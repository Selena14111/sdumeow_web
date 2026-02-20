import { ArrowLeftOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, Segmented, Tag } from 'antd'
import { Link, useNavigate } from 'react-router-dom'

import { ApiNotFoundError } from '@/api/adapters/errors'
import { getAdminAnnouncements } from '@/api/endpoints/admin'
import { ApiUnavailable } from '@/components/feedback/ApiUnavailable'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'

const notices = [
  ['2025-01-20', '寒假留校志愿者招募计划', '寒假将至，为了确保校园流浪猫在假期间的温饱与安全，本协会面向全校师生公开招募夜间定点巡查。'],
  ['2025-01-18', '关于规范教学区文明投喂的通知', '近期接到部分师生反馈，教学区主廊存在散落猫粮影响环境卫生的情况，请各位投喂者前往指定投喂点。'],
  ['2025-01-15', 'SDU Meow 协会新媒体部招新', '如果你热爱文字、擅长摄影，或者有一颗爱猫的心，欢迎加入我们，让更多人了解校园猫咪的故事。'],
]

export function AdminAnnouncementsPage() {
  usePageTitle('公告管理中心')
  const navigate = useNavigate()
  const query = useQuery({ queryKey: ['admin-announcements'], queryFn: getAdminAnnouncements })

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-[#f3f4f6] px-5 pb-24 pt-4">
      <div className="mb-4 rounded-b-3xl bg-white px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button className="!h-9 !w-9" icon={<ArrowLeftOutlined />} shape="circle" onClick={() => navigate(-1)} />
            <h1 className="text-4xl font-black text-[#263246]">公告管理中心</h1>
          </div>
          <Link to="/admin/announcements/1/edit">
            <Button className="!h-11 !w-11 !rounded-2xl !border-none !bg-[#10b981] !text-white" icon={<PlusOutlined />} />
          </Link>
        </div>
        <Segmented
          block
          className="!max-w-[260px]"
          options={[
            { label: '全部内容', value: 'all' },
            { label: '已发布', value: 'published' },
            { label: '已删除', value: 'deleted' },
          ]}
          value="all"
        />
      </div>

      <QueryState error={query.error} isLoading={query.isLoading}>
        <div className="space-y-4">
          {notices.map(([date, title, desc], index) => (
            <Card key={title} className="!rounded-[28px] !border-[#fdebcf] !bg-white" size="small">
              <div className="mb-2 flex items-center justify-between text-sm text-[#9ca3af]">
                <span>发布于 {date}</span>
                {index === 0 ? <Tag color="gold">重点置顶</Tag> : null}
              </div>
              <h3 className="text-4xl font-black text-[#293548]">{title}</h3>
              <p className="mt-3 line-clamp-3 text-base leading-7 text-[#8d97a7]">{desc}</p>
              <div className="mt-5 flex justify-end gap-4 text-xl">
                <Link to="/admin/announcements/1/edit"><EditOutlined /></Link>
                <DeleteOutlined className="text-[#ef4444]" />
              </div>
            </Card>
          ))}
        </div>
      </QueryState>

      {query.error instanceof ApiNotFoundError ? <div className="mt-4"><ApiUnavailable title="公告列表接口暂不可用，当前展示设计态" onRetry={() => query.refetch()} /></div> : null}
    </div>
  )
}
