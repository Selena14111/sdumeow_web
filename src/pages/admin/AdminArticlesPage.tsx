import {
  ArrowLeftOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  HeartOutlined,
  PlusOutlined,
  PushpinOutlined,
  StarOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Button, message } from 'antd'
import clsx from 'clsx'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { ApiNotFoundError } from '@/api/adapters/errors'
import { getAdminArticles } from '@/api/endpoints/articles'
import { ApiUnavailable } from '@/components/feedback/ApiUnavailable'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asRecord, asString, toPaged } from '@/utils/format'

type ArticleCategory = 'health' | 'nutrition' | 'behavior' | 'tnr'
type ArticleStatus = 'published' | 'draft' | 'scheduled'

type ArticleItem = {
  id: string
  title: string
  summary: string
  category: ArticleCategory
  date: string
  views: number
  likes: number
  collects: number
  status: ArticleStatus
  pinned: boolean
  hasCover: boolean
}

const fallbackArticles: ArticleItem[] = [
  {
    id: '1',
    title: '流浪猫常见疾病防治指南',
    summary:
      '流浪猫在野外生活中容易接触到各种疾病。本文将介绍猫瘟、杯状病毒、口炎等常见疾病的识别方式与应对建议，帮助同学们科学救助。',
    category: 'health',
    date: '2025-01-20',
    views: 3456,
    likes: 289,
    collects: 156,
    status: 'published',
    pinned: true,
    hasCover: true,
  },
  {
    id: '2',
    title: '科学喂养流浪猫：猫粮选购与投喂指南',
    summary:
      '从营养成分、原料来源与投喂频次三个维度，解析如何为校园流浪猫提供更稳定、更安全的日常喂养方案。',
    category: 'nutrition',
    date: '2025-01-18',
    views: 2103,
    likes: 178,
    collects: 0,
    status: 'published',
    pinned: false,
    hasCover: false,
  },
  {
    id: '3',
    title: '猫咪肢体语言大揭秘',
    summary:
      '耳朵、尾巴和眼神里都藏着情绪密码。理解猫咪行为信号，可以显著降低接触应激并提高救助效率。',
    category: 'behavior',
    date: '2025-01-15',
    views: 5678,
    likes: 456,
    collects: 0,
    status: 'scheduled',
    pinned: false,
    hasCover: false,
  },
  {
    id: '4',
    title: '什么是 TNR？流浪猫绝育行动科普',
    summary:
      'TNR 是目前国际上公认的流浪猫管理方式，包含诱捕、绝育、原地放归。本文梳理执行流程与常见误区。',
    category: 'tnr',
    date: '2025-01-12',
    views: 4231,
    likes: 312,
    collects: 0,
    status: 'draft',
    pinned: false,
    hasCover: false,
  },
]

const categoryMap: Record<ArticleCategory, { text: string; className: string }> = {
  health: { text: '健康科普', className: 'bg-[#dcfce7] text-[#16a34a]' },
  nutrition: { text: '营养知识', className: 'bg-[#fef3c7] text-[#d97706]' },
  behavior: { text: '行为解读', className: 'bg-[#dbeafe] text-[#2563eb]' },
  tnr: { text: 'TNR 科普', className: 'bg-[#fae8ff] text-[#9333ea]' },
}

const filterList: Array<{ key: 'all' | ArticleStatus; label: string }> = [
  { key: 'all', label: '全部文章' },
  { key: 'published', label: '已发布' },
  { key: 'draft', label: '草稿箱' },
  { key: 'scheduled', label: '定时发布' },
]

function normalizeArticleList(payload: unknown): ArticleItem[] {
  const rawItems = Array.isArray(payload) ? payload : toPaged<Record<string, unknown>>(payload).items

  return rawItems.map((item, index) => {
    const row = asRecord(item)
    const categoryRaw = asString(row.category || row.type, '').toLowerCase()
    const statusRaw = asString(row.status, '').toUpperCase()

    const category: ArticleCategory =
      categoryRaw.includes('nutrition') || categoryRaw.includes('营养')
        ? 'nutrition'
        : categoryRaw.includes('behavior') || categoryRaw.includes('行为')
          ? 'behavior'
          : categoryRaw.includes('tnr')
            ? 'tnr'
            : 'health'

    const status: ArticleStatus =
      statusRaw === 'DRAFT' ? 'draft' : statusRaw === 'SCHEDULED' ? 'scheduled' : 'published'

    return {
      id: asString(row.id, String(index + 1)),
      title: asString(row.title, `科普文章 ${index + 1}`),
      summary: asString(row.summary || row.content, '暂无摘要内容'),
      category,
      date: asString(row.publishDate || row.createdAt, '2025-01-01'),
      views: Number(row.views ?? 0),
      likes: Number(row.likes ?? row.favorites ?? 0),
      collects: Number(row.collects ?? row.bookmarks ?? 0),
      status,
      pinned: Boolean(row.pinned),
      hasCover: Boolean(row.coverUrl || row.coverImage),
    }
  })
}

export function AdminArticlesPage() {
  usePageTitle('科普文章管理')
  const navigate = useNavigate()
  const [activeFilter, setActiveFilter] = useState<'all' | ArticleStatus>('all')

  const query = useQuery({ queryKey: ['admin-articles'], queryFn: getAdminArticles })
  const articles = useMemo(() => {
    const normalized = normalizeArticleList(query.data?.data)
    if (normalized.length > 0) return normalized
    if (query.error instanceof ApiNotFoundError) return fallbackArticles
    return normalized
  }, [query.data?.data, query.error])

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return articles
    return articles.filter((item) => item.status === activeFilter)
  }, [activeFilter, articles])

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
            <h1 className="text-[22px] font-extrabold text-[#2c3e50]">科普文章管理</h1>
          </div>
          <Link to="/admin/articles/1/edit">
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
          emptyDescription="暂无科普文章"
        >
          <div className="space-y-4">
            {filtered.map((article) => (
              <article
                key={article.id}
                className={clsx(
                  'rounded-[20px] border border-[#f1f5f9] bg-white p-5 shadow-[0_4px_20px_rgba(0,0,0,0.04)]',
                  article.pinned && 'border-2 border-[#10b981] bg-gradient-to-br from-[#ecfdf5] to-white',
                )}
              >
                {article.pinned ? (
                  <span className="mb-2 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wide text-[#10b981]">
                    <PushpinOutlined />
                    重点推荐
                  </span>
                ) : null}

                <div className="mb-2 flex flex-wrap items-center gap-2 text-[12px] text-[#94a3b8]">
                  <span>发布于 {article.date}</span>
                  <span
                    className={clsx(
                      'rounded-lg px-2.5 py-1 text-[11px] font-bold',
                      categoryMap[article.category].className,
                    )}
                  >
                    {categoryMap[article.category].text}
                  </span>
                </div>

                <h2 className="mb-2 text-[16px] font-bold leading-7 text-[#0f172a]">{article.title}</h2>
                <p className="line-clamp-2 text-[13px] leading-6 text-[#64748b]">{article.summary}</p>

                {article.hasCover ? (
                  <div className="mt-3 h-[120px] overflow-hidden rounded-xl bg-gradient-to-br from-[#d1d5db] to-[#94a3b8]" />
                ) : null}

                <div className="mt-4 flex items-center gap-4 border-t border-[#f1f5f9] pt-4 text-[12px] text-[#94a3b8]">
                  <span className="inline-flex items-center gap-1">
                    <EyeOutlined />
                    {article.views}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <HeartOutlined />
                    {article.likes}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <StarOutlined />
                    {article.collects}
                  </span>

                  <div className="ml-auto flex items-center gap-2">
                    <Link
                      className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#f1f5f9] text-[#64748b]"
                      to={`/admin/articles/${article.id}/edit`}
                    >
                      <EditOutlined />
                    </Link>
                    <button
                      className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#fff1f2] text-[#e11d48]"
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
            <ApiUnavailable onRetry={() => query.refetch()} title="文章列表接口暂不可用，当前展示设计稿态" />
          </div>
        ) : null}
      </div>
    </div>
  )
}
