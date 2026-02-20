import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  MessageOutlined,
  PlusOutlined,
  PushpinOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Button, message } from 'antd'
import clsx from 'clsx'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ApiNotFoundError } from '@/api/adapters/errors'
import { getAdminAnnouncements } from '@/api/endpoints/admin'
import { ApiUnavailable } from '@/components/feedback/ApiUnavailable'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asRecord, asString, toPaged } from '@/utils/format'

type NoticeType = 'campus' | 'important' | 'recruitment'
type NoticeStatus = 'published' | 'draft' | 'scheduled'

type NoticeItem = {
  id: string
  title: string
  content: string
  date: string
  type: NoticeType
  status: NoticeStatus
  views: number
  comments: number
  pinned: boolean
}

const fallbackNotices: NoticeItem[] = [
  {
    id: '1',
    title: '寒假留校志愿者招募计划',
    content:
      '寒假将至，为确保校园流浪猫在假期期间的温饱与安全，协会面向全校师生公开招募留校守护志愿者。主要负责定点投喂、健康观察与记录反馈。',
    date: '2025-01-20',
    type: 'important',
    status: 'published',
    views: 1240,
    comments: 45,
    pinned: true,
  },
  {
    id: '2',
    title: '关于规范教学区文明投喂的通知',
    content:
      '近期教学区出现猫粮散落影响卫生的情况，请各位同学前往指定投喂点并及时清理包装，共同维护良好的校园环境。',
    date: '2025-01-18',
    type: 'campus',
    status: 'published',
    views: 856,
    comments: 0,
    pinned: false,
  },
  {
    id: '3',
    title: 'SDU Meow 协会新媒体部招新',
    content:
      '如果你热爱文字、擅长摄影，或者有一颗爱猫的心，欢迎加入我们。新媒体部将负责公众号、小红书等内容运营。',
    date: '2025-01-15',
    type: 'recruitment',
    status: 'scheduled',
    views: 2103,
    comments: 12,
    pinned: false,
  },
]

const typeMap: Record<NoticeType, { text: string; className: string }> = {
  campus: { text: '校园公告', className: 'bg-[#e0f2f1] text-[#26a69a]' },
  important: { text: '紧急通知', className: 'bg-[#ffebee] text-[#ff5252]' },
  recruitment: { text: '招募信息', className: 'bg-[#f1f5f9] text-[#475569]' },
}

const filterList: Array<{ key: 'all' | NoticeStatus; label: string }> = [
  { key: 'all', label: '全部内容' },
  { key: 'published', label: '已发布' },
  { key: 'draft', label: '草稿箱' },
  { key: 'scheduled', label: '定时发布' },
]

function normalizeNoticeList(payload: unknown): NoticeItem[] {
  const rawItems = Array.isArray(payload) ? payload : toPaged<Record<string, unknown>>(payload).items

  return rawItems.map((item, index) => {
    const row = asRecord(item)
    const statusRaw = asString(row.status, '').toUpperCase()
    const typeRaw = asString(row.type, '').toLowerCase()

    const status: NoticeStatus =
      statusRaw === 'DRAFT' ? 'draft' : statusRaw === 'SCHEDULED' ? 'scheduled' : 'published'

    const type: NoticeType =
      typeRaw.includes('important') || typeRaw.includes('紧急')
        ? 'important'
        : typeRaw.includes('recruit') || typeRaw.includes('招募')
          ? 'recruitment'
          : 'campus'

    return {
      id: asString(row.id, String(index + 1)),
      title: asString(row.title, `公告 ${index + 1}`),
      content: asString(row.content || row.summary, '暂无公告内容'),
      date: asString(row.publishDate || row.createdAt, '2025-01-01'),
      type,
      status,
      views: Number(row.views ?? 0),
      comments: Number(row.comments ?? 0),
      pinned: Boolean(row.pinned),
    }
  })
}

export function AdminAnnouncementsPage() {
  usePageTitle('公告管理中心')
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState<'all' | NoticeStatus>('all')

  const query = useQuery({ queryKey: ['admin-announcements'], queryFn: getAdminAnnouncements })
  const notices = useMemo(() => {
    const normalized = normalizeNoticeList(query.data?.data)
    if (normalized.length > 0) return normalized
    if (query.error instanceof ApiNotFoundError) return fallbackNotices
    return normalized
  }, [query.data?.data, query.error])

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return notices
    return notices.filter((item) => item.status === activeFilter)
  }, [activeFilter, notices])

  return (
    <div className="pb-8">
      <section className="mb-4 rounded-b-[24px] bg-white px-5 pb-5 pt-5 shadow-[0_2px_15px_rgba(0,0,0,0.04)]">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              className="!h-10 !w-10 !border-none !bg-[#f5f5f5] !text-[#7f8c8d]"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
              shape="circle"
              type="text"
            />
            <h1 className="text-[22px] font-extrabold text-[#2c3e50]">公告管理中心</h1>
          </div>
          <Link to="/admin/announcements/1/edit">
            <Button
              className="!h-11 !w-11 !rounded-[14px] !border-none !text-white"
              icon={<PlusOutlined />}
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
              }}
              type="text"
            />
          </Link>
        </div>

        <div className="chip-row gap-2 pb-1">
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
      </section>

      <div className="h5-content pt-2">
        <QueryState
          error={query.error instanceof ApiNotFoundError ? null : query.error}
          isEmpty={!query.isLoading && !query.error && filtered.length === 0}
          isLoading={query.isLoading}
          emptyDescription="暂无公告内容"
        >
          <div className="space-y-5">
            {filtered.map((notice) => (
              <article
                key={notice.id}
                className={clsx(
                  'relative rounded-[24px] border border-black/[0.03] bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.02)]',
                  notice.pinned && 'bg-gradient-to-br from-[#fffdfb] to-white',
                )}
              >
                {notice.pinned ? (
                  <span className="absolute -top-2 right-5 inline-flex items-center gap-1 rounded-full bg-[#ffa000] px-2.5 py-1 text-[10px] font-extrabold text-white shadow-[0_4px_8px_rgba(255,160,0,0.2)]">
                    <PushpinOutlined />
                    重点置顶
                  </span>
                ) : null}

                <span className="mb-2 block text-[12px] text-[#94a3b8]">发布于 {notice.date}</span>
                <span
                  className={clsx(
                    'mb-3 inline-flex rounded-lg px-2.5 py-1 text-[11px] font-bold',
                    typeMap[notice.type].className,
                  )}
                >
                  {typeMap[notice.type].text}
                </span>

                <h2 className="mb-2 text-[18px] font-black leading-7 text-[#2c3e50]">{notice.title}</h2>
                <p className="line-clamp-3 text-[14px] leading-6 text-[#7f8c8d]">{notice.content}</p>

                <div className="mt-4 flex items-center border-t border-dashed border-[#f1f5f9] pt-4 text-[12px] text-[#94a3b8]">
                  <span className="mr-4 inline-flex items-center gap-1">
                    <EyeOutlined />
                    {notice.views}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageOutlined />
                    {notice.comments}
                  </span>

                  <div className="ml-auto flex items-center gap-3">
                    <Link
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f8fafc] text-[#64748b]"
                      to={`/admin/announcements/${notice.id}/edit`}
                    >
                      <EditOutlined />
                    </Link>
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fff1f2] text-[#e11d48]"
                      onClick={() => message.info('当前为 Mock 环境，删除操作仅展示交互效果')}
                      type="button"
                    >
                      <DeleteOutlined />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </QueryState>

        {query.error instanceof ApiNotFoundError ? (
          <div className="mt-4">
            <ApiUnavailable onRetry={() => query.refetch()} title="公告列表接口暂不可用，当前展示设计稿态" />
          </div>
        ) : null}
      </div>
    </div>
  )
}
