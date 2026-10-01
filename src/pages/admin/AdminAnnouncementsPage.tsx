import { ArrowLeftOutlined, DeleteOutlined, EditOutlined, PlusOutlined, PushpinOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Modal, message } from 'antd'
import clsx from 'clsx'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ApiNotFoundError } from '@/api/adapters/errors'
import { deleteAdminAnnouncement, getAdminAnnouncements } from '@/api/endpoints/admin'
import { getAnnouncementTypes } from '@/api/endpoints/types'
import { ApiUnavailable } from '@/components/feedback/ApiUnavailable'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'
import { getAnnouncementTypeLabel, getAnnouncementTypeOptions } from '@/utils/announcementTypes'
import { asRecord, asString, formatTimestampText, toPaged } from '@/utils/format'

type NoticeStatus = 'published' | 'deleted'

type NoticeItem = {
  id: string
  title: string
  content: string
  date: string
  type: string
  status: NoticeStatus
  pinned: boolean
  deleted: boolean
}

function asNoticeId(value: unknown, fallback: string): string {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'string' && value.trim()) return value
  return fallback
}

function isDeletedAnnouncement(row: Record<string, unknown>): boolean {
  const status = asString(row.status || row.state || row.auditStatus).toUpperCase()
  return status.includes('DELETE') || status.includes('REMOVED') || row.deleted === true || row.isDeleted === true
}

function normalizePinned(row: Record<string, unknown>): boolean {
  return Boolean(row.pinned ?? row.isPinned ?? row.top ?? row.isTop)
}

function formatNoticeDate(value: unknown): string {
  const text = formatTimestampText(value, '').trim()
  if (!text) return '--'
  return text.split(/[ T]/)[0] || text
}

function normalizeNoticeList(payload: unknown, typeOptions = getAnnouncementTypeOptions(null)): NoticeItem[] {
  const rawItems = Array.isArray(payload) ? payload : toPaged<Record<string, unknown>>(payload).items

  return rawItems.map((item, index) => {
    const row = asRecord(item)
    const deleted = isDeletedAnnouncement(row)

    return {
      id: asNoticeId(row.id ?? row.announcementId ?? row.noticeId, String(index + 1)),
      title: asString(row.title, `公告 ${index + 1}`),
      content: asString(row.content || row.summary || row.description, '暂无公告内容'),
      date: formatNoticeDate(row.publishTime || row.publishDate || row.createdAt || row.createTime || row.updatedAt),
      type: getAnnouncementTypeLabel(row.type ?? row.category, typeOptions),
      status: deleted ? 'deleted' : 'published',
      pinned: normalizePinned(row),
      deleted,
    }
  })
}

export function AdminAnnouncementsPage() {
  usePageTitle('公告管理中心')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [deletingId, setDeletingId] = useState('')

  const query = useQuery({
    queryKey: ['admin-announcements', 'list'],
    queryFn: () => getAdminAnnouncements({ page: 1, size: 100, pageSize: 100 }),
  })
  const typesQuery = useQuery({
    queryKey: ['type', 'announcement-types'],
    queryFn: getAnnouncementTypes,
  })
  const announcementTypeOptions = useMemo(() => getAnnouncementTypeOptions(typesQuery.data?.data), [typesQuery.data?.data])

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminAnnouncement(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
      Modal.success({
        title: '删除成功',
        content: '公告已删除',
        okText: '知道了',
      })
      setDeletingId('')
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : '删除失败，请稍后重试')
      setDeletingId('')
    },
  })

  const notices = useMemo(() => normalizeNoticeList(query.data?.data, announcementTypeOptions), [announcementTypeOptions, query.data?.data])

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-8">
      <section className="mb-8 rounded-b-[28px] bg-white px-5 pb-8 pt-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              className="!h-10 !w-10 !border-none !bg-[#f5f5f5] !text-[#0f172a]"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
              shape="circle"
              type="text"
            />
            <h1 className="text-[22px] font-extrabold text-[#2c3e50]">公告管理中心</h1>
          </div>
          <Link to="/admin/announcements/new/edit">
            <Button
              className="!h-12 !w-12 !rounded-[14px] !border-none !text-[24px] !text-white"
              icon={<PlusOutlined />}
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                boxShadow: '0 10px 22px rgba(16, 185, 129, 0.32)',
              }}
              type="text"
            />
          </Link>
        </div>
      </section>

      <div className="h5-content pt-0">
        <QueryState
          error={query.error instanceof ApiNotFoundError ? null : query.error}
          isEmpty={!query.isLoading && !query.error && notices.length === 0}
          isLoading={query.isLoading}
          emptyDescription="暂无公告内容"
        >
          <div className="space-y-5">
            {notices.map((notice) => (
              <article
                key={notice.id}
                className={clsx(
                  'relative rounded-[24px] border bg-white px-5 pb-4 pt-6 shadow-[0_12px_30px_rgba(15,23,42,0.04)]',
                  notice.pinned ? 'border-[#fee6b5]' : 'border-black/[0.03]',
                )}
              >
                {notice.pinned ? (
                  <span className="absolute -top-2 right-4 inline-flex items-center gap-1 rounded-full bg-[#ffa000] px-3 py-1 text-[10px] font-extrabold text-white shadow-[0_5px_12px_rgba(255,160,0,0.22)]">
                    <PushpinOutlined />
                    重点置顶
                  </span>
                ) : null}

                <div className="mb-4 flex flex-wrap items-center gap-2 text-[11px] font-medium text-[#94a3b8]">
                  <span>发布于 {notice.date}</span>
                  <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-[10px] font-bold text-[#64748b]">{notice.type}</span>
                </div>
                <h2 className="mb-5 text-[18px] font-black leading-7 text-[#2c3e50]">{notice.title}</h2>
                <p className="line-clamp-3 min-h-[72px] text-[14px] font-medium leading-6 text-[#7f8c8d]">
                  {notice.content}
                </p>

                <div className="mt-8 flex items-center border-t border-dashed border-[#edf2f7] pt-4">
                  <span className="text-[11px] font-semibold text-[#cbd5e1]">{notice.deleted ? '已删除' : '已发布'}</span>
                  <div className="ml-auto flex items-center gap-4">
                    <Link
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f8fafc] text-[#0f172a]"
                      state={{ notice }}
                      to={`/admin/announcements/${notice.id}/edit`}
                    >
                      <EditOutlined />
                    </Link>
                    <button
                      aria-label="删除公告"
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-[#fff1f2] text-[#ef4444] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#fecaca] hover:bg-[#fff1f2] hover:shadow-[0_8px_18px_rgba(220,38,38,0.18)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        setDeletingId(notice.id)
                        deleteMutation.mutate(notice.id)
                      }}
                      type="button"
                    >
                      {deleteMutation.isPending && deletingId === notice.id ? '…' : <DeleteOutlined />}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </QueryState>

        {query.error instanceof ApiNotFoundError ? (
          <div className="mt-4">
            <ApiUnavailable onRetry={() => query.refetch()} title="公告列表接口暂不可用" />
          </div>
        ) : null}
      </div>
    </div>
  )
}
