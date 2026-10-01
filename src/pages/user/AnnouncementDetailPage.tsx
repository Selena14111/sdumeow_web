import { ArrowLeftOutlined, CalendarOutlined, NotificationOutlined, PushpinOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Button } from 'antd'
import { useMemo } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { getAnnouncementDetail } from '@/api/endpoints/announcements'
import { getAnnouncementTypes } from '@/api/endpoints/types'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'
import { getAnnouncementTypeLabel, getAnnouncementTypeOptions } from '@/utils/announcementTypes'
import { asRecord, asString, formatTimestampText } from '@/utils/format'

type AnnouncementDetail = {
  id: string
  title: string
  content: string
  date: string
  type: string
  pinned: boolean
  deleted: boolean
}

function asAnnouncementText(value: unknown, fallback = ''): string {
  if (typeof value === 'string') return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return fallback
}

function firstPresent(...values: unknown[]): unknown {
  return values.find((value) => {
    if (value === null || value === undefined) return false
    if (typeof value === 'string') return value.trim().length > 0
    return true
  })
}

function formatAnnouncementDate(value: unknown): string {
  const text = formatTimestampText(value, '').trim()
  if (!text) return '--'
  return text.split(/[ T]/)[0] || text
}

function normalizePinned(row: Record<string, unknown>): boolean {
  return Boolean(row.pinned ?? row.isPinned ?? row.top ?? row.isTop)
}

function isDeletedAnnouncement(row: Record<string, unknown>): boolean {
  const status = asString(row.status || row.state).toUpperCase()
  return status.includes('DELETE') || status.includes('REMOVED') || row.deleted === true || row.isDeleted === true
}

function unwrapAnnouncement(value: unknown): Record<string, unknown> {
  const row = asRecord(value)
  const nested = asRecord(row.announcement || row.notice || row.detail)
  return Object.keys(nested).length ? nested : row
}

function normalizeAnnouncementDetail(value: unknown, fallback: unknown, routeId: string, typeOptions = getAnnouncementTypeOptions(null)): AnnouncementDetail {
  const row = unwrapAnnouncement(value)
  const fallbackRow = unwrapAnnouncement(fallback)

  return {
    id: asAnnouncementText(firstPresent(row.id, row.announcementId, row.noticeId, fallbackRow.id, fallbackRow.announcementId, fallbackRow.noticeId), routeId),
    title: asAnnouncementText(firstPresent(row.title, fallbackRow.title), '公告详情'),
    content: asAnnouncementText(firstPresent(row.content, row.summary, row.description, fallbackRow.content, fallbackRow.summary, fallbackRow.description), '暂无公告内容'),
    date: formatAnnouncementDate(
      firstPresent(
        row.publishTime,
        row.publishDate,
        row.createdAt,
        row.createTime,
        row.updatedAt,
        fallbackRow.publishTime,
        fallbackRow.publishDate,
        fallbackRow.createdAt,
        fallbackRow.createTime,
        fallbackRow.updatedAt,
      ),
    ),
    type: getAnnouncementTypeLabel(firstPresent(row.type, row.category, fallbackRow.type, fallbackRow.category), typeOptions),
    pinned: normalizePinned(row) || normalizePinned(fallbackRow),
    deleted: isDeletedAnnouncement(row) || isDeletedAnnouncement(fallbackRow),
  }
}

function splitAnnouncementContent(content: string): string[] {
  const paragraphs = content
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean)

  return paragraphs.length ? paragraphs : ['暂无公告内容']
}

export function AnnouncementDetailPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { id = '' } = useParams()
  const noticeFromState = asRecord(asRecord(location.state).notice)
  const hasStateNotice = Boolean(noticeFromState.title || noticeFromState.content)

  const query = useQuery({
    queryKey: ['announcement-detail', id],
    queryFn: () => getAnnouncementDetail(id),
    enabled: Boolean(id),
  })
  const typesQuery = useQuery({
    queryKey: ['type', 'announcement-types'],
    queryFn: getAnnouncementTypes,
  })
  const announcementTypeOptions = useMemo(() => getAnnouncementTypeOptions(typesQuery.data?.data), [typesQuery.data?.data])

  const detail = useMemo(
    () => normalizeAnnouncementDetail(query.data?.data, noticeFromState, id, announcementTypeOptions),
    [announcementTypeOptions, id, noticeFromState, query.data?.data],
  )
  const paragraphs = useMemo(() => splitAnnouncementContent(detail.content), [detail.content])

  usePageTitle(detail.title || '公告详情')

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
            <h1 className="text-[22px] font-extrabold text-[#2c3e50]">公告详情</h1>
            <p className="mt-1 text-[12px] text-[#94a3b8]">查看公告正文内容</p>
          </div>
        </div>
      </section>

      <main className="h5-content pt-0">
        <QueryState
          error={hasStateNotice ? null : query.error}
          isEmpty={!query.isLoading && !query.error && detail.deleted}
          isLoading={query.isLoading && !hasStateNotice}
          emptyDescription="公告不存在或已删除"
        >
          <article className="relative rounded-[24px] border border-black/[0.03] bg-white px-5 pb-6 pt-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
            {detail.pinned ? (
              <span className="absolute -top-2 right-4 inline-flex items-center gap-1 rounded-full bg-[#ffa000] px-3 py-1 text-[10px] font-extrabold text-white shadow-[0_5px_12px_rgba(255,160,0,0.22)]">
                <PushpinOutlined />
                重点置顶
              </span>
            ) : null}

            <div className="mb-4 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-[#94a3b8]">
              <span className="inline-flex items-center gap-1">
                <NotificationOutlined className="text-[#10b981]" />
                {detail.type}
              </span>
              <span className="inline-flex items-center gap-1">
                <CalendarOutlined />
                发布于 {detail.date}
              </span>
            </div>

            <h2 className="text-[22px] font-black leading-8 text-[#2c3e50]">{detail.title}</h2>

            <div className="mt-5 space-y-4 border-t border-dashed border-[#edf2f7] pt-5 text-[15px] leading-8 text-[#475569]">
              {paragraphs.map((paragraph, index) => (
                <p key={`${detail.id}-${index}`}>{paragraph}</p>
              ))}
            </div>
          </article>
        </QueryState>
      </main>
    </div>
  )
}
