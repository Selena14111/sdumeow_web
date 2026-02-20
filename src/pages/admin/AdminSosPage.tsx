import {
  BellOutlined,
  CheckCircleFilled,
  PhoneFilled,
  StopFilled,
} from '@ant-design/icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button, message } from 'antd'
import clsx from 'clsx'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { ApiNotFoundError } from '@/api/adapters/errors'
import { getAdminSos, resolveSos } from '@/api/endpoints/sos'
import { ApiUnavailable } from '@/components/feedback/ApiUnavailable'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asRecord, asString, toPaged } from '@/utils/format'

type SosFilter = 'all' | 'medical' | 'lost' | 'resolved'

type SosItem = {
  id: string
  catName: string
  campus: string
  symptom: string
  reporterName: string
  reporterMeta: string
  phone: string
  status: 'pending' | 'resolved'
  category: 'medical' | 'lost' | 'other'
  priorityColor: string
  createdAt: string
}

const filterList: Array<{ key: SosFilter; label: string }> = [
  { key: 'all', label: '全部求助' },
  { key: 'medical', label: '紧急医疗' },
  { key: 'lost', label: '走失寻找' },
  { key: 'resolved', label: '已关闭' },
]

function normalizeSosItems(payload: unknown): SosItem[] {
  const pagedItems = toPaged<Record<string, unknown>>(payload).items
  const rawItems = Array.isArray(payload) ? payload : pagedItems

  return rawItems.map((item, index) => {
    const row = asRecord(item)
    const statusRaw = asString(row.status, '').toUpperCase()
    const typeRaw = asString(row.type, '').toLowerCase()
    const symptom = asString(row.description || row.symptom, '右后腿外伤出血，行动困难')
    const isResolved = ['RESOLVED', 'CLOSED', 'DONE'].includes(statusRaw)

    let category: SosItem['category'] = 'other'
    if (typeRaw.includes('lost') || typeRaw.includes('寻') || symptom.includes('失踪') || symptom.includes('走失')) {
      category = 'lost'
    } else if (
      typeRaw.includes('medical') ||
      symptom.includes('伤') ||
      symptom.includes('流血') ||
      symptom.includes('呕吐')
    ) {
      category = 'medical'
    }

    const priorityRaw = asString(row.priority, '').toUpperCase()
    const priorityColor =
      isResolved || priorityRaw === 'LOW'
        ? '#64748B'
        : priorityRaw === 'HIGH' || priorityRaw === 'CRITICAL' || category === 'medical'
          ? '#E11D48'
          : '#F59E0B'

    return {
      id: asString(row.id, String(index + 1)),
      catName: asString(row.catName || row.cat, `待救助猫咪${index + 1}`),
      campus: asString(row.campus || row.location, '软件园校区'),
      symptom,
      reporterName: asString(row.reporterName || row.userName, '匿名同学'),
      reporterMeta: asString(row.reporterMeta || row.department, '山东大学在校生'),
      phone: asString(row.phone, '13800000000'),
      status: isResolved ? 'resolved' : 'pending',
      category,
      priorityColor,
      createdAt: asString(row.createdAt || row.time, ''),
    }
  })
}

function isToday(value: string) {
  if (!value) return false
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return false
  const today = new Date()
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  )
}

export function AdminSosPage() {
  usePageTitle('SOS 紧急求助系统')
  const [activeFilter, setActiveFilter] = useState<SosFilter>('all')
  const [resolvingId, setResolvingId] = useState<string | null>(null)

  const query = useQuery({ queryKey: ['admin-sos'], queryFn: getAdminSos })
  const allItems = useMemo(() => normalizeSosItems(query.data?.data), [query.data?.data])

  const filteredItems = useMemo(() => {
    if (activeFilter === 'all') return allItems
    if (activeFilter === 'resolved') return allItems.filter((item) => item.status === 'resolved')
    return allItems.filter((item) => item.category === activeFilter)
  }, [activeFilter, allItems])

  const stats = useMemo(() => {
    const pending = allItems.filter((item) => item.status === 'pending').length
    const today = allItems.filter((item) => isToday(item.createdAt)).length
    const resolved = allItems.filter((item) => item.status === 'resolved').length
    return { pending, today, resolved }
  }, [allItems])

  const resolveMutation = useMutation({
    mutationFn: (id: string) => resolveSos(id, { status: 'RESOLVED', reply: '管理员已安排同学前往处理' }),
    onMutate: (id) => setResolvingId(id),
    onSuccess: () => {
      message.success('已标记为解决')
      query.refetch()
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '操作失败，请稍后重试'),
    onSettled: () => setResolvingId(null),
  })

  return (
    <div className="pb-8">
      <section className="mb-5 rounded-b-[30px] bg-gradient-to-br from-[#fff8e1] to-white px-5 pb-6 pt-6 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-[24px] font-extrabold tracking-tight text-[#2c3e50]">SOS 紧急求助系统</h1>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff1f2] text-[#e11d48]">
            <BellOutlined />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-[20px] bg-[#fff1f2] px-2 py-3 text-center">
            <span className="block text-[22px] font-black leading-none text-[#e11d48]">{stats.pending}</span>
            <span className="mt-1 block text-[11px] font-bold text-[#7f8c8d]">待处理</span>
          </div>
          <div className="rounded-[20px] bg-[#f8fafc] px-2 py-3 text-center">
            <span className="block text-[22px] font-black leading-none text-[#64748b]">{stats.today}</span>
            <span className="mt-1 block text-[11px] font-bold text-[#7f8c8d]">今日新增</span>
          </div>
          <div className="rounded-[20px] bg-[#f8fafc] px-2 py-3 text-center">
            <span className="block text-[22px] font-black leading-none text-[#64748b]">{stats.resolved}</span>
            <span className="mt-1 block text-[11px] font-bold text-[#7f8c8d]">已关闭</span>
          </div>
        </div>
      </section>

      <div className="h5-content pt-0">
        <div className="chip-row mb-5 gap-2 pb-2">
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

        <QueryState
          error={query.error}
          isEmpty={!query.isLoading && !query.error && filteredItems.length === 0}
          isLoading={query.isLoading}
          emptyDescription="暂无对应 SOS 求助"
        >
          <div className="space-y-4">
            {filteredItems.map((item) => (
              <Link
                key={item.id}
                className="block rounded-[28px] border border-black/[0.03] bg-white p-5 shadow-[0_10px_30px_rgba(0,0,0,0.02)]"
                to={`/admin/sos/${item.id}`}
              >
                <h3 className="mb-4 flex items-center gap-2 text-[20px] font-black text-[#2c3e50]">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.priorityColor }} />
                  {item.catName}
                </h3>

                <div className="mb-2 flex items-start justify-between gap-3 text-[13px]">
                  <span className="font-semibold text-[#7f8c8d]">所属校区</span>
                  <span className="max-w-[65%] text-right font-bold text-[#334155]">{item.campus}</span>
                </div>
                <div className="mb-4 flex items-start justify-between gap-3 text-[13px]">
                  <span className="font-semibold text-[#7f8c8d]">求助症状</span>
                  <span
                    className={clsx(
                      'max-w-[65%] text-right font-bold',
                      item.status === 'pending' ? 'text-[#e11d48]' : 'text-[#64748b]',
                    )}
                  >
                    {item.symptom}
                  </span>
                </div>

                <div className="mb-4 flex items-center gap-3 rounded-[20px] bg-[#f8fafc] p-4">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[#cbd5e1] to-[#94a3b8]" />
                  <div className="flex-1">
                    <p className="text-[14px] font-extrabold text-[#2c3e50]">{item.reporterName}</p>
                    <p className="text-[11px] text-[#7f8c8d]">{item.reporterMeta}</p>
                  </div>
                  <a
                    className="flex h-9 w-9 items-center justify-center rounded-full text-[#10b981]"
                    href={`tel:${item.phone}`}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <PhoneFilled />
                  </a>
                </div>

                <div className="grid grid-cols-[1.5fr_1fr] gap-3">
                  <Button
                    className="!h-12 !rounded-[18px] !border-none !text-sm !font-extrabold"
                    disabled={item.status === 'resolved'}
                    icon={<CheckCircleFilled />}
                    loading={resolvingId === item.id}
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      if (item.status === 'resolved') return
                      resolveMutation.mutate(item.id)
                    }}
                    style={{
                      background:
                        item.status === 'resolved'
                          ? '#d1d5db'
                          : 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                      color: '#fff',
                      boxShadow: item.status === 'resolved' ? 'none' : '0 8px 20px rgba(16, 185, 129, 0.2)',
                    }}
                    type="text"
                  >
                    {item.status === 'resolved' ? '已解决' : '标记解决'}
                  </Button>
                  <Button
                    className="!h-12 !rounded-[18px] !border-none !bg-[#f1f5f9] !text-sm !font-extrabold !text-[#64748b]"
                    icon={<StopFilled />}
                    onClick={(event) => {
                      event.preventDefault()
                      event.stopPropagation()
                      message.info('已取消本次受理操作')
                    }}
                    type="text"
                  >
                    取消
                  </Button>
                </div>
              </Link>
            ))}
          </div>
        </QueryState>

        {query.error instanceof ApiNotFoundError ? (
          <div className="mt-4">
            <ApiUnavailable onRetry={() => query.refetch()} title="SOS 列表接口暂不可用，当前展示设计态" />
          </div>
        ) : null}
      </div>
    </div>
  )
}



