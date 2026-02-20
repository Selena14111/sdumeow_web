import {
  ArrowLeftOutlined,
  HomeOutlined,
  MedicineBoxOutlined,
  ReadOutlined,
  SearchOutlined,
  StarFilled,
  ToolOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Input, Tag } from 'antd'
import clsx from 'clsx'
import { Link, useNavigate } from 'react-router-dom'

import { ApiNotFoundError } from '@/api/adapters/errors'
import { getArticles } from '@/api/endpoints/articles'
import { ApiUnavailable } from '@/components/feedback/ApiUnavailable'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asArray, asRecord, asString } from '@/utils/format'

const topics = [
  { label: '推荐', icon: <StarFilled /> },
  { label: '喂养', icon: <ReadOutlined /> },
  { label: '医疗', icon: <MedicineBoxOutlined /> },
  { label: '行为', icon: <ToolOutlined /> },
  { label: '领养', icon: <HomeOutlined /> },
]

const fallbackArticles = [
  {
    id: '11',
    title: '校园偶遇流浪猫，正确的投喂姿势是什么？',
    tag: '喂养',
    time: '5分钟前',
  },
  {
    id: '12',
    title: '猫咪口炎的早期症状与防治',
    tag: '医疗',
    time: '昨天',
  },
]

export function KepuPage() {
  usePageTitle('养猫科普')
  const navigate = useNavigate()
  const query = useQuery({
    queryKey: ['articles'],
    queryFn: getArticles,
  })

  const articleItems = asArray<Record<string, unknown>>(asRecord(query.data?.data).items)

  return (
    <div className="pb-6">
      <div className="sticky top-0 z-20 bg-[#f8f6f4] px-5 pb-3 pt-4">
        <div className="mb-4 flex items-center gap-3">
          <button className="top-icon-btn" type="button" onClick={() => navigate(-1)}>
            <ArrowLeftOutlined />
          </button>
          <Input
            className="!h-[40px] !rounded-full !border-none !bg-[#f5f5f5]"
            placeholder="搜索科普文章..."
            prefix={<SearchOutlined className="text-[#999]" />}
          />
        </div>

        <div className="chip-row gap-3">
          {topics.map((topic, index) => (
            <button key={topic.label} className="min-w-[56px] text-center" type="button">
              <div
                className={clsx(
                  'mx-auto mb-1 flex h-12 w-12 items-center justify-center rounded-2xl text-[20px]',
                  index === 0 ? 'bg-[#e8f5e9] text-[#2e7d32]' : 'bg-[#f5f5f5] text-[#555]',
                )}
              >
                {topic.icon}
              </div>
              <p className="text-[12px] text-[#666]">{topic.label}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="h5-content pt-2">
        <h2 className="mb-3 text-[16px] font-bold">每日必读</h2>
        <Link
          className="mb-5 block overflow-hidden rounded-[20px] bg-white shadow-[0_8px_20px_rgba(0,0,0,0.06)]"
          to="/user/articles/1"
        >
          <div className="relative h-44 bg-gradient-to-br from-[#bdd8b5] to-[#6aa36f]">
            <Tag className="!absolute !left-3 !top-3 !m-0 !rounded-md !bg-black/60 !px-2 !py-0 !text-[10px] !text-white">
              TNR 科普
            </Tag>
          </div>
          <div className="p-4">
            <h3 className="text-[16px] font-bold text-[#1a1a1a]">什么是 TNR？为什么要做绝育？</h3>
            <p className="mt-1 text-[12px] leading-5 text-[#666]">
              TNR 是目前国际公认的控制流浪猫数量最有效的方法之一，能减少无序繁殖并提升猫群健康...
            </p>
            <div className="mt-2 flex items-center justify-between text-[11px] text-[#999]">
              <span>👀 1,230 阅读</span>
              <span>2小时前</span>
            </div>
          </div>
        </Link>

        <h2 className="mb-3 text-[16px] font-bold">最新文章</h2>
        <div className="space-y-3">
          {(articleItems.length ? articleItems.slice(0, 4) : fallbackArticles).map((item, index) => {
            const row = asRecord(item)
            const id = asString(row.id, String(index + 1))
            const title = asString(row.title, fallbackArticles[index % fallbackArticles.length].title)
            const tag = asString(row.category, fallbackArticles[index % fallbackArticles.length].tag)
            const time = asString(row.time, fallbackArticles[index % fallbackArticles.length].time)
            return (
              <Link
                key={id}
                className="flex gap-3 rounded-[16px] bg-white p-3 shadow-[0_8px_16px_rgba(0,0,0,0.06)]"
                to={`/user/articles/${id}`}
              >
                <div className="h-20 w-20 flex-none rounded-xl bg-gradient-to-br from-[#d1d5db] to-[#94a3b8]" />
                <div className="flex min-w-0 flex-1 flex-col justify-between">
                  <p className="line-clamp-2 text-[14px] font-semibold leading-5 text-[#1a1a1a]">{title}</p>
                  <div className="flex items-center gap-2 text-[10px] text-[#999]">
                    <Tag
                      className={clsx(
                        '!m-0 !rounded-md !px-1.5 !py-0 !text-[10px]',
                        tag === '医疗' ? '!bg-[#ffebee] !text-[#d32f2f]' : '!bg-[#e8f5e9] !text-[#2e7d32]',
                      )}
                    >
                      {tag}
                    </Tag>
                    <span>{time}</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>

        {query.error instanceof ApiNotFoundError ? (
          <div className="mt-4">
            <ApiUnavailable title="科普列表接口暂不可用，当前展示设计态" onRetry={() => query.refetch()} />
          </div>
        ) : null}
      </div>
    </div>
  )
}
