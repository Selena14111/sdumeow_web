import { ArrowLeftOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { getMyAdoptions } from '@/api/endpoints/adoptions'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asRecord, asString, toPaged } from '@/utils/format'

type StatusKey = 'all' | 'processing' | 'pending' | 'approved' | 'rejected'

type ApplicationRecord = {
  id: string
  catName: string
  campus: string
  createdAt: string
  status: Exclude<StatusKey, 'all'>
  type: string
  progress: string
}

const statusMap: Record<string, ApplicationRecord['status']> = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PROCESSING: 'processing',
}

const statusLabel: Record<StatusKey, string> = {
  all: '全部',
  processing: '处理中',
  pending: '待审核',
  approved: '已通过',
  rejected: '已拒绝',
}

const fallbackData: ApplicationRecord[] = [
  {
    id: '1',
    catName: '橘座大人',
    campus: '软件园校区',
    createdAt: '2024-01-20',
    status: 'processing',
    type: '领养申请',
    progress: '等待面试反馈',
  },
  {
    id: '2',
    catName: '糯米团子',
    campus: '中心校区',
    createdAt: '2024-01-22',
    status: 'pending',
    type: '投喂点申请',
    progress: '等待管理员审核',
  },
  {
    id: '3',
    catName: '煤球同学',
    campus: '兴隆山校区',
    createdAt: '2024-01-10',
    status: 'approved',
    type: '绝育申请',
    progress: '已完成',
  },
]

export function UserCenterPage() {
  usePageTitle('我的申请')
  const navigate = useNavigate()
  const [active, setActive] = useState<StatusKey>('all')

  const query = useQuery({
    queryKey: ['my-adoptions'],
    queryFn: getMyAdoptions,
  })

  const rawItems = toPaged<Record<string, unknown>>(query.data?.data).items

  const records = useMemo<ApplicationRecord[]>(() => {
    const list = rawItems.length
      ? rawItems.map((item, index) => {
          const row = asRecord(item)
          const statusValue = asString(row.status, 'PENDING').toUpperCase()
          return {
            id: asString(row.id, String(index + 1)),
            catName: asString(row.catName || row.cat_name, `猫咪${index + 1}`),
            campus: asString(row.campus, '中心校区'),
            createdAt: asString(row.createdAt || row.created_at, '2024-01-20'),
            status: statusMap[statusValue] ?? 'pending',
            type: asString(row.type, '领养申请'),
            progress: asString(row.progress, '等待管理员处理'),
          }
        })
      : fallbackData
    return list
  }, [rawItems])

  const filtered = active === 'all' ? records : records.filter((item) => item.status === active)

  const summary = {
    processing: records.filter((item) => item.status === 'processing').length,
    approved: records.filter((item) => item.status === 'approved').length,
    pending: records.filter((item) => item.status === 'pending').length,
  }

  return (
    <div className="h5-content pb-6">
      <div className="mb-5 flex items-center gap-3">
        <button className="top-icon-btn !rounded-xl" type="button" onClick={() => navigate(-1)}>
          <ArrowLeftOutlined />
        </button>
        <h1 className="text-[22px] font-bold">我的申请</h1>
      </div>

      <div className="mb-5 grid grid-cols-3 gap-2">
        {[
          ['处理中', summary.processing, 'processing'],
          ['已通过', summary.approved, 'approved'],
          ['待审核', summary.pending, 'pending'],
        ].map(([label, count, tone]) => (
          <div key={String(label)} className="rounded-xl bg-white px-2 py-3 text-center shadow-[0_8px_16px_rgba(0,0,0,0.06)]">
            <p
              className={clsx(
                'text-[24px] font-bold',
                tone === 'processing' && 'text-[#42a5f5]',
                tone === 'approved' && 'text-[#66bb6a]',
                tone === 'pending' && 'text-[#ffa726]',
              )}
            >
              {count as number}
            </p>
            <p className="text-[11px] text-[#999]">{label as string}</p>
          </div>
        ))}
      </div>

      <div className="chip-row mb-4">
        {(Object.keys(statusLabel) as StatusKey[]).map((status) => (
          <button
            key={status}
            className={clsx(
              'rounded-full border px-4 py-2 text-[12px] font-semibold transition',
              active === status
                ? 'border-[#1a1a1a] bg-[#1a1a1a] text-white'
                : 'border-[#eee] bg-white text-[#666]',
            )}
            type="button"
            onClick={() => setActive(status)}
          >
            {statusLabel[status]}
          </button>
        ))}
      </div>

      <QueryState error={query.error} isLoading={query.isLoading}>
        <div className="space-y-3">
          {filtered.map((item) => (
            <div key={item.id} className="rounded-2xl bg-white p-4 shadow-[0_8px_18px_rgba(0,0,0,0.06)]">
              <div className="mb-2 flex items-start justify-between">
                <div className="flex gap-2">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#d1d5db] to-[#94a3b8]" />
                  <div>
                    <p className="text-[15px] font-bold">{item.catName}</p>
                    <p className="text-[11px] text-[#999]">
                      {item.campus} · 申请于 {item.createdAt}
                    </p>
                  </div>
                </div>
                <span
                  className={clsx(
                    'rounded-full px-2 py-1 text-[10px] font-semibold',
                    item.status === 'processing' && 'bg-[#e3f2fd] text-[#1565c0]',
                    item.status === 'pending' && 'bg-[#fff3e0] text-[#e65100]',
                    item.status === 'approved' && 'bg-[#e8f5e9] text-[#2e7d32]',
                    item.status === 'rejected' && 'bg-[#ffebee] text-[#c62828]',
                  )}
                >
                  {statusLabel[item.status]}
                </span>
              </div>

              <div className="border-t border-[#f5f5f5] pt-2 text-[12px] text-[#666]">
                <div className="mb-1 flex justify-between">
                  <span className="text-[#999]">申请类型</span>
                  <span className="font-medium text-[#333]">{item.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#999]">当前进度</span>
                  <span className="font-medium text-[#333]">{item.progress}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </QueryState>
    </div>
  )
}
