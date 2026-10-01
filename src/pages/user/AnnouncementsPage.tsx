import { ArrowLeftOutlined, NotificationOutlined, PushpinOutlined, RightOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Button } from 'antd'
import clsx from 'clsx'
import { useEffect, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { getAnnouncements } from '@/api/endpoints/announcements'
import { getAnnouncementTypes } from '@/api/endpoints/types'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'
import { markAnnouncementsSeen } from '@/utils/announcementNotifications'
import { getAnnouncementTypeLabel, getAnnouncementTypeOptions } from '@/utils/announcementTypes'
import { asRecord, asString, formatTimestampText, toPaged } from '@/utils/format'

type AnnouncementItem = {
  id: string
  title: string
  content: string
  date: string
  type: string
  pinned: boolean
}

function asAnnouncementText(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return fallback
}

function formatAnnouncementDate(value: unknown): string {
  const text = formatTimestampText(value, '').trim()
  if (!text) return '--'
  return text.split(/[ T]/)[0] || text
}

function isDeletedAnnouncement(row: Record<string, unknown>): boolean {
  const status = asString(row.status || row.state).toUpperCase()
  return status.includes('DELETE') || status.includes('REMOVED') || row.deleted === true || row.isDeleted === true
}

function normalizePinned(row: Record<string, unknown>): boolean {
  return Boolean(row.pinned ?? row.isPinned ?? row.top ?? row.isTop)
}

function normalizeAnnouncements(payload: unknown, typeOptions = getAnnouncementTypeOptions(null)): AnnouncementItem[] {
  const rawItems = Array.isArray(payload) ? payload : toPaged<Record<string, unknown>>(payload).items

  const normalized = rawItems
    .map((item, index) => {
      const row = asRecord(item)
      return {
        id: asAnnouncementText(row.id || row.announcementId || row.noticeId, String(index + 1)),
        title: asAnnouncementText(row.title, `公告 ${index + 1}`),
        content: asAnnouncementText(row.content || row.summary || row.description, '暂无公告内容'),
        date: formatAnnouncementDate(row.publishTime || row.publishDate || row.createdAt || row.createTime || row.updatedAt),
        type: getAnnouncementTypeLabel(row.type ?? row.category, typeOptions),
        pinned: normalizePinned(row),
        deleted: isDeletedAnnouncement(row),
      }
    })

  return normalized.filter((item) => !item.deleted).map(({ deleted: _deleted, ...item }) => item)
}

export function AnnouncementsPage() {
  usePageTitle('公告列表')
  const navigate = useNavigate()
  const query = useQuery({
    queryKey: ['announcements', 'user-list'],
    queryFn: () => getAnnouncements({ page: 1, pageSize: 100 }),
  })
  const typesQuery = useQuery({
    queryKey: ['type', 'announcement-types'],
    queryFn: getAnnouncementTypes,
  })
  const announcementTypeOptions = useMemo(() => getAnnouncementTypeOptions(typesQuery.data?.data), [typesQuery.data?.data])
  const announcements = useMemo(
    () => normalizeAnnouncements(query.data?.data, announcementTypeOptions),
    [announcementTypeOptions, query.data?.data],
  )

  useEffect(() => {
    if (query.isSuccess) {
      markAnnouncementsSeen()
    }
  }, [query.isSuccess, query.dataUpdatedAt])

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-8">
      <section className="mb-6 rounded-b-[28px] bg-white px-5 pb-6 pt-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="flex items-center gap-3">
          <Button
            className="!h-10 !w-10 !border-none !bg-[#f5f5f5] !text-[#0f172a]"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            shape="circle"
            type="text"
          />
          <div>
            <h1 className="text-[22px] font-extrabold text-[#2c3e50]">公告列表</h1>
            <p className="mt-1 text-[12px] text-[#94a3b8]">查看校园猫咪相关通知</p>
          </div>
        </div>
      </section>

      <div className="h5-content pt-0">
        <QueryState
          error={query.error}
          isEmpty={!query.isLoading && !query.error && announcements.length === 0}
          isLoading={query.isLoading}
          emptyDescription="暂无公告内容"
        >
          <div className="space-y-4">
            {announcements.map((notice) => (
              <Link
                key={notice.id}
                className={clsx(
                  'relative block rounded-[22px] border bg-white px-5 pb-4 pt-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition-transform active:scale-[0.98]',
                  notice.pinned ? 'border-[#fee6b5]' : 'border-black/[0.03]',
                )}
                state={{ notice }}
                to={`/user/announcements/${notice.id}`}
              >
                {notice.pinned ? (
                  <span className="absolute -top-2 right-4 inline-flex items-center gap-1 rounded-full bg-[#ffa000] px-3 py-1 text-[10px] font-extrabold text-white shadow-[0_5px_12px_rgba(255,160,0,0.22)]">
                    <PushpinOutlined />
                    置顶
                  </span>
                ) : null}

                <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold text-[#94a3b8]">
                  <NotificationOutlined className="text-[#10b981]" />
                  <span>发布于 {notice.date}</span>
                </div>
                <h2 className="mb-3 text-[17px] font-black leading-6 text-[#2c3e50]">{notice.title}</h2>
                <p className="line-clamp-3 text-[13px] leading-6 text-[#64748b]">{notice.content}</p>

                <div className="mt-4 flex items-center justify-between border-t border-dashed border-[#edf2f7] pt-3">
                  <span className="rounded-full bg-[#f1f5f9] px-2 py-1 text-[10px] font-bold text-[#64748b]">{notice.type}</span>
                  <RightOutlined className="text-[13px] text-[#cbd5e1]" />
                </div>
              </Link>
            ))}
          </div>
        </QueryState>
      </div>
    </div>
  )
}
