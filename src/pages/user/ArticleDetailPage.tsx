import { ArrowLeftOutlined, ClockCircleOutlined, EyeOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'

import { ApiNotFoundError } from '@/api/adapters/errors'
import { getArticleDetail } from '@/api/endpoints/articles'
import { ApiUnavailable } from '@/components/feedback/ApiUnavailable'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asNumber, asRecord, asString } from '@/utils/format'

function asText(value: unknown, fallback = ''): string {
  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  return fallback
}

export function ArticleDetailPage() {
  usePageTitle('文章详情')
  const navigate = useNavigate()
  const { id = '1' } = useParams()

  const query = useQuery({
    queryKey: ['article-detail', id],
    queryFn: () => getArticleDetail(id),
  })

  const detail = asRecord(query.data?.data)
  const tag = asString(detail.category || detail.tag, 'TNR 科普')
  const cover = asString(detail.cover || detail.coverUrl || detail.image || detail.thumbnail, '')
  const readCount = asNumber(detail.readCount ?? detail.viewCount, 1230)
  const publishTime = asText(detail.publishTime || detail.createdAt || detail.time, '2小时前')
  const rawText = asString(detail.content || detail.summary, '')
  const paragraphs = (rawText
    ? rawText
        .replace(/<[^>]*>/g, '\n')
        .split(/\n+/)
        .map((item) => item.trim())
        .filter(Boolean)
    : ['TNR（Trap-Neuter-Return）指“诱捕、绝育、放归”，是目前国际上管理流浪猫群最有效且人道的方法。']
  ).slice(0, 8)
  const title = asString(detail.title, '什么是 TNR？为什么要做绝育？')

  return (
    <div className="pb-6">
      <div
        className="relative h-56 bg-gradient-to-br from-[#bdd8b5] to-[#6aa36f]"
        style={cover ? { backgroundImage: `url(${cover})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
      >
        <button
          className="absolute left-5 top-5 flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-black/20 text-white backdrop-blur"
          type="button"
          onClick={() => navigate(-1)}
        >
          <ArrowLeftOutlined />
        </button>
      </div>

      <div className="-mt-7 px-5">
        <QueryState error={query.error} isLoading={query.isLoading}>
          <article className="rounded-[22px] bg-white p-5 shadow-[0_10px_24px_rgba(0,0,0,0.08)]">
            <span className="inline-flex rounded-md bg-[#1f2937] px-2 py-1 text-[10px] text-white">{tag}</span>
            <h1 className="mt-3 text-[22px] font-extrabold leading-8 text-[#1a1a1a]">{title}</h1>
            <div className="mt-2 flex items-center gap-4 text-[11px] text-[#999]">
              <span className="flex items-center gap-1">
                <EyeOutlined />
                {`${readCount} 阅读`}
              </span>
              <span className="flex items-center gap-1">
                <ClockCircleOutlined />
                {publishTime}
              </span>
            </div>

            <div className="mt-4 space-y-3 text-[14px] leading-7 text-[#4b5563]">
              {paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </article>
        </QueryState>

        {query.error instanceof ApiNotFoundError ? (
          <div className="mt-4">
            <ApiUnavailable title="文章详情接口暂不可用，当前展示设计态" onRetry={() => query.refetch()} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
