import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Input, message } from 'antd'
import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { ApiError, ApiNotFoundError } from '@/api/adapters/errors'
import { deleteAdminCat, getAdminCats } from '@/api/endpoints/admin'
import { ApiUnavailable } from '@/components/feedback/ApiUnavailable'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asArray, asRecord, asString, toPaged } from '@/utils/format'

type CatStatus = '在校' | '待领养' | '已领养' | '已毕业' | '治疗中'

type CatItem = {
  id: string
  name: string
  avatar: string
  status: CatStatus
  meta: string
  tags: string[]
}

const filters = ['全部', '待领养', '在校', '已领养', '已毕业', '治疗中']

const fallbackCats: CatItem[] = [
  { id: '1', name: '少女', avatar: '', status: '待领养', meta: '玳瑁 · 仁园食堂', tags: ['待领养', '亲人'] },
  { id: '2', name: 'Ctrl', avatar: '', status: '在校', meta: '狸花 · 软件园校区', tags: ['在校', '话痨'] },
  { id: '3', name: '麻薯', avatar: '', status: '已毕业', meta: '三花 · 软件园校区', tags: ['已领养', '吃货'] },
  { id: '4', name: '大橘座', avatar: '', status: '在校', meta: '橘猫 · 中心校区', tags: ['在校', '霸主'] },
  { id: '5', name: '蛋奶', avatar: '', status: '在校', meta: '奶牛 · 图书馆', tags: ['在校', '安静'] },
  { id: '6', name: '小黑', avatar: '', status: '治疗中', meta: '纯黑 · 软件园校区', tags: ['治疗中', '高冷'] },
]

const statusStyle: Record<CatStatus, string> = {
  在校: 'text-[#2e7d32]',
  待领养: 'text-[#d32f2f]',
  已领养: 'text-[#7c3aed]',
  已毕业: 'text-[#1565c0]',
  治疗中: 'text-[#f57c00]',
}

function normalizeCats(payload: unknown): CatItem[] {
  const rawItems = toPaged<Record<string, unknown>>(payload).items

  return rawItems.map((item, index) => {
    const row = asRecord(item)
    const statusRaw = asString(row.statusText || row.status, '').toUpperCase()
    const status: CatStatus =
      statusRaw.includes('TREAT')
        ? '治疗中'
        : statusRaw.includes('ADOPTED')
          ? '已领养'
          : statusRaw.includes('ADOPT') || statusRaw.includes('PENDING')
        ? '待领养'
          : statusRaw.includes('GRADUATE')
            ? '已毕业'
            : '在校'

    return {
      id: asString(row.id, String(index + 1)),
      name: asString(row.name, `猫咪${index + 1}`),
      avatar: asString(row.avatar || row.image),
      status,
      meta: asString(row.meta, `${asString(row.color, '未知花色')} · ${asString(row.location || row.locationName, '未知地点')}`),
      tags: asArray<string>(row.tags),
    }
  })
}

function isRecoverableAdminCatsError(error: unknown): boolean {
  if (error instanceof ApiNotFoundError) return true
  return error instanceof ApiError && error.shape.httpStatus !== null && error.shape.httpStatus >= 500
}

export function AdminCatsPage() {
  usePageTitle('猫咪档案管理')
  const queryClient = useQueryClient()
  const [activeFilter, setActiveFilter] = useState('全部')
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [deletingId, setDeletingId] = useState('')
  const query = useQuery({ queryKey: ['admin-cats'], queryFn: getAdminCats })
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminCat(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['admin-cats'] })
      message.success('猫咪档案已删除')
      setDeletingId('')
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : '删除失败，请稍后重试')
      setDeletingId('')
    },
  })

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setKeyword(keywordInput.trim().toLowerCase())
    }, 250)
    return () => window.clearTimeout(timer)
  }, [keywordInput])

  const cats = useMemo(() => {
    const normalized = normalizeCats(query.data?.data)
    if (normalized.length > 0) return normalized
    if (isRecoverableAdminCatsError(query.error)) return fallbackCats
    return normalized
  }, [query.data?.data, query.error])

  const filteredCats = useMemo(() => {
    const byFilter =
      activeFilter === '全部'
        ? cats
        : cats.filter((cat) => {
            if (activeFilter === '已领养') {
              return cat.status === '已领养' || cat.status === '已毕业'
            }
            return cat.status === activeFilter
          })

    if (!keyword) return byFilter

    return byFilter.filter((cat) => [cat.name, cat.meta, ...cat.tags].join(' ').toLowerCase().includes(keyword))
  }, [activeFilter, cats, keyword])

  return (
    <div className="pb-8">
      <section className="mb-5 rounded-b-[24px] bg-white px-5 pb-5 pt-5 shadow-[0_2px_15px_rgba(0,0,0,0.04)]">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-[22px] font-bold text-[#2c3e50]">猫咪档案管理</h1>
          <Link
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#ffd54f] text-[#5d4037] shadow-[0_4px_10px_rgba(255,213,79,0.4)]"
            to="/admin/cats/new/edit"
          >
            <PlusOutlined />
          </Link>
        </div>

        <Input
          className="!h-12 !rounded-2xl !border-none !bg-[#f5f5f5]"
          placeholder="搜索猫咪名字、花色或地点..."
          prefix={<SearchOutlined className="text-[#bdc3c7]" />}
          value={keywordInput}
          onChange={(event) => setKeywordInput(event.target.value)}
        />
      </section>

      <div className="h5-content pt-0">
        <div className="chip-row mb-4">
          {filters.map((item) => (
            <button
              key={item}
              className={clsx(
                'whitespace-nowrap rounded-full border px-4 py-2 text-[13px] transition',
                activeFilter === item
                  ? 'border-transparent bg-[#ffd54f] font-semibold text-[#5d4037] shadow-[0_4px_10px_rgba(255,213,79,0.3)]'
                  : 'border-black/[0.05] bg-white text-[#7f8c8d]',
              )}
              onClick={() => setActiveFilter(item)}
              type="button"
            >
              {item}
            </button>
          ))}
        </div>

        <QueryState
          error={isRecoverableAdminCatsError(query.error) ? null : query.error}
          isEmpty={!query.isLoading && !query.error && filteredCats.length === 0}
          isLoading={query.isLoading}
          emptyDescription="暂无猫咪档案"
        >
          <div className="grid grid-cols-2 gap-3">
            {filteredCats.map((cat) => (
              <article
                key={cat.id}
                className="overflow-hidden rounded-[20px] border border-black/[0.03] bg-white shadow-[0_8px_20px_rgba(0,0,0,0.04)]"
              >
                <div className="relative h-36 bg-gradient-to-br from-[#d1d5db] to-[#94a3b8]">
                  {cat.avatar ? <img alt={cat.name} className="h-full w-full object-cover" src={cat.avatar} /> : null}
                  <span
                    className={clsx(
                      'absolute right-2 top-2 rounded-xl bg-white/90 px-2 py-1 text-[10px] font-bold',
                      statusStyle[cat.status],
                    )}
                  >
                    {cat.status}
                  </span>
                </div>

                <div className="p-3">
                  <h3 className="mb-1 text-[15px] font-bold text-[#2c3e50]">{cat.name}</h3>
                  <p className="mb-2 text-[11px] text-[#7f8c8d]">{cat.meta}</p>

                  <div className="mb-3 flex flex-wrap gap-1">
                    {(cat.tags.length > 0 ? cat.tags : ['在校']).slice(0, 2).map((tag) => (
                      <span
                        key={tag}
                        className={clsx(
                          'rounded-lg px-2 py-0.5 text-[10px] font-semibold',
                          tag.includes('待领养') && 'bg-[#ffebee] text-[#d32f2f]',
                          tag.includes('在校') && 'bg-[#e8f5e9] text-[#2e7d32]',
                          !tag.includes('待领养') && !tag.includes('在校') && 'bg-[#f1f5f9] text-[#475569]',
                        )}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <Link
                      className="rounded-lg bg-[#fff8e1] py-1.5 text-center text-[12px] font-semibold text-[#ffa000]"
                      state={{ cat }}
                      to={`/admin/cats/${cat.id}/edit`}
                    >
                      编辑
                    </Link>
                    <Link
                      className="rounded-lg bg-[#f5f5f5] py-1.5 text-center text-[12px] font-semibold text-[#7f8c8d]"
                      to={`/user/cats/${cat.id}/profile`}
                    >
                      详情
                    </Link>
                    <button
                      className="rounded-lg bg-[#fff1f2] py-1.5 text-center text-[12px] font-semibold text-[#e11d48]"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        setDeletingId(cat.id)
                        deleteMutation.mutate(cat.id)
                      }}
                      type="button"
                    >
                      {deleteMutation.isPending && deletingId === cat.id ? '删除中' : '删除'}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </QueryState>

        {isRecoverableAdminCatsError(query.error) ? (
          <div className="mt-4">
            <ApiUnavailable onRetry={() => query.refetch()} title="猫咪管理接口暂不可用，当前展示设计稿态" />
          </div>
        ) : null}
      </div>

      <Link
        className="fixed bottom-24 right-5 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-[#ffd54f] text-[24px] text-[#5d4037] shadow-[0_8px_25px_rgba(255,213,79,0.5)]"
        to="/admin/cats/new/edit"
      >
        <PlusOutlined />
      </Link>
    </div>
  )
}
