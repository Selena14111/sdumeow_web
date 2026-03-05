import { CheckCircleFilled, SearchOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Input, message } from 'antd'
import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'

import { approveAdminNewCat, getAdminNewCats } from '@/api/endpoints/admin'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asArray, asRecord, asString, toPaged } from '@/utils/format'
import { normalizeMediaUrl } from '@/utils/media'

type ReviewStatus = 'pending' | 'approved' | 'rejected'
type ReviewFilter = 'all' | ReviewStatus

type NewCatReviewItem = {
  id: string
  name: string
  avatar: string
  status: ReviewStatus
  color: string
  campus: string
  location: string
  reporter: string
  createdAt: string
  tags: string[]
}

const filters: Array<{ key: ReviewFilter; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待审核' },
  { key: 'approved', label: '已通过' },
  { key: 'rejected', label: '已拒绝' },
]

const campusCodeToLabelMap: Record<string, string> = {
  '0': '中心校区',
  '1': '趵突泉校区',
  '2': '洪家楼校区',
  '3': '千佛山校区',
  '4': '兴隆山校区',
  '5': '软件园校区',
  '6': '青岛校区',
  '7': '威海校区',
}

const campusEnumToLabelMap: Record<string, string> = {
  CENTRAL: '中心校区',
  BAOTUQUAN: '趵突泉校区',
  HONGJIALOU: '洪家楼校区',
  QIANFOSHAN: '千佛山校区',
  XINGLONGSHAN: '兴隆山校区',
  SOFTWARE_PARK: '软件园校区',
  QINGDAO: '青岛校区',
  WEIHAI: '威海校区',
}

function normalizeCampus(rawCampus: unknown): string {
  const campus = asString(rawCampus).trim()
  if (!campus) return ''
  if (campus in campusCodeToLabelMap) return campusCodeToLabelMap[campus]
  const enumCampus = campus.toUpperCase()
  if (enumCampus in campusEnumToLabelMap) return campusEnumToLabelMap[enumCampus]
  return campus
}

function normalizeReviewStatus(rawStatus: unknown): ReviewStatus {
  const status = asString(rawStatus).trim().toUpperCase()
  if (!status) return 'pending'
  if (status.includes('APPROVED') || status.includes('PASS') || status.includes('ACCEPT')) return 'approved'
  if (status.includes('REJECT') || status.includes('REFUSE') || status.includes('DENY')) return 'rejected'
  return 'pending'
}

function normalizeNewCats(payload: unknown): NewCatReviewItem[] {
  const rawItems = Array.isArray(payload) ? payload : toPaged<Record<string, unknown>>(payload).items

  return rawItems.map((item, index) => {
    const row = asRecord(item)
    const basicInfo = asRecord(row.basicInfo)
    const images = asArray<string>(row.images)
    const campus = normalizeCampus(row.campus || basicInfo.campus)
    const color = asString(row.color || basicInfo.color, '未知花色')
    const location = asString(row.location || row.locationName || basicInfo.hauntLocation, campus || '未知地点')

    return {
      id: asString(row.id || row.newCatId, String(index + 1)),
      name: asString(row.tempName || row.name || row.catName, `新猫咪${index + 1}`),
      avatar: normalizeMediaUrl(row.avatar || row.image || images[0]),
      status: normalizeReviewStatus(row.status || row.auditStatus),
      color,
      campus,
      location,
      reporter: asString(row.userName || row.reporterName || row.nickname, '匿名用户'),
      createdAt: asString(row.createdAt || row.createTime || row.time, '刚刚提交'),
      tags: asArray<string>(row.tags),
    }
  })
}

const statusStyle: Record<ReviewStatus, string> = {
  pending: 'bg-[#fff8e1] text-[#ffa000]',
  approved: 'bg-[#e8f5e9] text-[#2e7d32]',
  rejected: 'bg-[#ffebee] text-[#d32f2f]',
}

const statusText: Record<ReviewStatus, string> = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
}

export function AdminNewCatsPage() {
  usePageTitle('审核新猫')
  const queryClient = useQueryClient()
  const [activeFilter, setActiveFilter] = useState<ReviewFilter>('all')
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [statusOverride, setStatusOverride] = useState<Record<string, ReviewStatus>>({})

  const query = useQuery({ queryKey: ['admin-new-cats'], queryFn: getAdminNewCats })
  const items = useMemo(() => normalizeNewCats(query.data?.data), [query.data?.data])

  useEffect(() => {
    const timer = window.setTimeout(() => setKeyword(keywordInput.trim().toLowerCase()), 250)
    return () => window.clearTimeout(timer)
  }, [keywordInput])

  const displayedItems = useMemo(() => {
    const merged = items.map((item) => ({ ...item, status: statusOverride[item.id] ?? item.status }))
    const filtered = activeFilter === 'all' ? merged : merged.filter((item) => item.status === activeFilter)
    if (!keyword) return filtered
    return filtered.filter((item) =>
      [item.name, item.color, item.campus, item.location, item.reporter, item.createdAt, ...item.tags].join(' ').toLowerCase().includes(keyword),
    )
  }, [activeFilter, items, keyword, statusOverride])

  const counts = useMemo(() => {
    const merged = items.map((item) => ({ ...item, status: statusOverride[item.id] ?? item.status }))
    return {
      all: merged.length,
      pending: merged.filter((item) => item.status === 'pending').length,
      approved: merged.filter((item) => item.status === 'approved').length,
      rejected: merged.filter((item) => item.status === 'rejected').length,
    }
  }, [items, statusOverride])

  const approveMutation = useMutation({
    mutationFn: (id: string) => approveAdminNewCat(id, { status: 'APPROVED' }),
    onSuccess: (_, id) => {
      setStatusOverride((current) => ({ ...current, [id]: 'approved' }))
      message.success('审核通过')
      void queryClient.invalidateQueries({ queryKey: ['admin-new-cats'] })
      void queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] })
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '审核失败，请稍后再试'),
  })

  return (
    <div className="pb-8">
      <section className="mb-5 rounded-b-[24px] bg-white px-5 pb-5 pt-5 shadow-[0_2px_15px_rgba(0,0,0,0.04)]">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-[22px] font-bold text-[#2c3e50]">审核新猫</h1>
          <span className="rounded-lg bg-[#f1f5f9] px-2 py-1 text-[11px] text-[#94a3b8]">{`待审核 ${counts.pending}`}</span>
        </div>

        <Input
          className="!h-12 !rounded-2xl !border-none !bg-[#f5f5f5]"
          placeholder="搜索猫咪名称、校区或提交人..."
          prefix={<SearchOutlined className="text-[#bdc3c7]" />}
          value={keywordInput}
          onChange={(event) => setKeywordInput(event.target.value)}
        />
      </section>

      <div className="h5-content pt-0">
        <div className="chip-row mb-4">
          {filters.map((item) => (
            <button
              key={item.key}
              className={clsx(
                'whitespace-nowrap rounded-full border px-4 py-2 text-[13px] transition',
                activeFilter === item.key
                  ? 'border-transparent bg-[#ffd54f] font-semibold text-[#5d4037] shadow-[0_4px_10px_rgba(255,213,79,0.3)]'
                  : 'border-black/[0.05] bg-white text-[#7f8c8d]',
              )}
              onClick={() => setActiveFilter(item.key)}
              type="button"
            >
              {`${item.label} ${counts[item.key]}`}
            </button>
          ))}
        </div>

        <QueryState
          error={query.error}
          isEmpty={!query.isLoading && !query.error && displayedItems.length === 0}
          isLoading={query.isLoading}
          emptyDescription="暂无新猫审核数据"
        >
          <div className="grid grid-cols-2 gap-3">
            {displayedItems.map((item) => {
              const isPending = item.status === 'pending'
              const isApproving = approveMutation.isPending && approveMutation.variables === item.id

              return (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-[20px] border border-black/[0.03] bg-white shadow-[0_8px_20px_rgba(0,0,0,0.04)]"
                >
                  <div className="relative h-32 bg-gradient-to-br from-[#d1d5db] to-[#94a3b8]">
                    {item.avatar ? <img alt={item.name} className="h-full w-full object-cover" src={item.avatar} /> : null}
                    <span className={clsx('absolute right-2 top-2 rounded-xl px-2 py-1 text-[10px] font-bold', statusStyle[item.status])}>
                      {statusText[item.status]}
                    </span>
                  </div>

                  <div className="p-3">
                    <h3 className="mb-1 text-[15px] font-bold text-[#2c3e50]">{item.name}</h3>
                    <p className="mb-1 text-[11px] text-[#7f8c8d]">{`${item.color} · ${item.campus || item.location}`}</p>
                    <p className="mb-2 text-[11px] text-[#94a3b8]">{`${item.reporter} · ${item.createdAt}`}</p>

                    <div className="mb-3 flex flex-wrap gap-1">
                      {(item.tags.length > 0 ? item.tags : ['新猫申请']).slice(0, 2).map((tag) => (
                        <span key={tag} className="rounded-lg bg-[#f1f5f9] px-2 py-0.5 text-[10px] font-semibold text-[#475569]">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <Button
                      block
                      className={clsx(
                        '!h-[34px] !rounded-lg !text-[12px] !font-semibold',
                        isPending
                          ? '!border-none !bg-[#e8f5e9] !text-[#2e7d32]'
                          : '!border-none !bg-[#f1f5f9] !text-[#7f8c8d]',
                      )}
                      disabled={!isPending}
                      icon={<CheckCircleFilled />}
                      loading={isApproving}
                      onClick={() => approveMutation.mutate(item.id)}
                      type="text"
                    >
                      {isPending ? '通过审核' : item.status === 'approved' ? '已通过' : '已拒绝'}
                    </Button>
                  </div>
                </article>
              )
            })}
          </div>
        </QueryState>
      </div>
    </div>
  )
}

