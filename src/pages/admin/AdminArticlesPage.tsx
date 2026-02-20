import { ArrowLeftOutlined, DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, Segmented, Tag } from 'antd'
import { Link, useNavigate } from 'react-router-dom'

import { ApiNotFoundError } from '@/api/adapters/errors'
import { getAdminArticles } from '@/api/endpoints/articles'
import { ApiUnavailable } from '@/components/feedback/ApiUnavailable'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'

const articles = [
  ['2025-01-20', '健康科普', '流浪猫常见疾病防治指南', '流浪猫在野外生活中容易接触到各种疾病，了解常见疾病的症状和预防措施对于关爱流浪猫至关重要。'],
  ['2025-01-18', '营养知识', '科学喂养流浪猫：猫粮选购与投喂指南', '市面上的猫粮品牌繁多，如何为流浪猫选择合适的食物？本文将从营养成分、原料来源等角度讲解。'],
  ['2025-01-15', '行为解读', '猫咪肢体语言大揭秘', '猫咪不会说话，但它们通过尾巴、耳朵、眼睛等部位传达丰富的信息。'],
]

export function AdminArticlesPage() {
  usePageTitle('科普文章管理')
  const navigate = useNavigate()
  const query = useQuery({ queryKey: ['admin-articles'], queryFn: getAdminArticles })

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-[#f3f4f6] px-5 pb-24 pt-4">
      <div className="mb-4 rounded-b-3xl bg-white px-4 py-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button className="!h-9 !w-9" icon={<ArrowLeftOutlined />} shape="circle" onClick={() => navigate(-1)} />
            <h1 className="text-4xl font-black text-[#263246]">科普文章管理</h1>
          </div>
          <Link to="/admin/articles/1/edit">
            <Button className="!h-11 !w-11 !rounded-2xl !border-none !bg-[#10b981] !text-white" icon={<PlusOutlined />} />
          </Link>
        </div>

        <Segmented
          block
          className="!max-w-[260px]"
          options={[
            { label: '全部文章', value: 'all' },
            { label: '已发布', value: 'published' },
            { label: '已删除', value: 'deleted' },
          ]}
          value="all"
        />
      </div>

      <QueryState error={query.error} isLoading={query.isLoading}>
        <div className="space-y-4">
          {articles.map(([date, type, title, desc], index) => (
            <Card key={title} className={`!rounded-3xl !border-none ${index === 0 ? '!ring-2 !ring-[#16b57d]' : ''}`} size="small">
              <div className="mb-2 flex items-center gap-2 text-sm text-[#9ca3af]">
                <span>发布于 {date}</span>
                <Tag className="!rounded-full" color={index === 0 ? 'green' : index === 1 ? 'gold' : 'blue'}>
                  {type}
                </Tag>
              </div>
              <h3 className="text-4xl font-black text-[#263246]">{title}</h3>
              <p className="mt-2 line-clamp-3 text-base leading-7 text-[#8f98a8]">{desc}</p>
              <div className="mt-3 h-32 rounded-2xl bg-slate-300" />
              <div className="mt-4 flex justify-end gap-4 text-xl">
                <Link to="/admin/articles/1/edit"><EditOutlined /></Link>
                <DeleteOutlined className="text-[#ef4444]" />
              </div>
            </Card>
          ))}
        </div>
      </QueryState>

      {query.error instanceof ApiNotFoundError ? <div className="mt-4"><ApiUnavailable title="文章列表接口暂不可用，当前展示设计态" onRetry={() => query.refetch()} /></div> : null}
    </div>
  )
}
