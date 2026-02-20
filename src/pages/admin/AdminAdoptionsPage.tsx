import { CalendarOutlined, ClockCircleOutlined, SearchOutlined, UserOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Input } from 'antd'
import clsx from 'clsx'
import { useMemo } from 'react'
import { Link } from 'react-router-dom'

import { getAdminAdoptions } from '@/api/endpoints/adoptions'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asRecord, asString, toPaged } from '@/utils/format'

type AdoptionStatus = 'pending' | 'review' | 'approved' | 'rejected'

type AdoptionItem = {
  id: string
  applicant: string
  catName: string
  catMeta: string
  status: AdoptionStatus
  time: string
  reason?: string
}

const statusText: Record<AdoptionStatus, string> = {
  pending: '待初审',
  review: '已约面谈',
  approved: '待签协议',
  rejected: '已拒绝',
}

const fallbackItems: AdoptionItem[] = [
  {
    id: '1',
    applicant: '张晓雨',
    catName: '麻薯',
    catMeta: '软件园校区 · 三花 · 母',
    status: 'pending',
    time: '刚刚提交',
  },
  {
    id: '2',
    applicant: '李思华',
    catName: '少女',
    catMeta: '仁园食堂 · 玳瑁 · 母',
    status: 'review',
    time: '昨天提交',
  },
  {
    id: '3',
    applicant: '赵小凡',
    catName: '大白',
    catMeta: '图书馆 · 纯白 · 公',
    status: 'approved',
    time: '3 天前申请',
  },
  {
    id: '4',
    applicant: '孙大明',
    catName: 'Ctrl',
    catMeta: '软件园校区 · 狸花 · 公',
    status: 'rejected',
    time: '已驳回',
    reason: '住所条件不符合要求',
  },
]

function normalizeItems(payload: unknown): AdoptionItem[] {
  const rawItems = toPaged<Record<string, unknown>>(payload).items

  return rawItems.map((item, index) => {
    const row = asRecord(item)
    const rawStatus = asString(row.status, 'PENDING').toUpperCase()

    const status: AdoptionStatus =
      rawStatus === 'APPROVED'
        ? 'approved'
        : rawStatus === 'REJECTED'
          ? 'rejected'
          : rawStatus === 'INTERVIEW'
            ? 'review'
            : 'pending'

    return {
      id: asString(row.id, String(index + 1)),
      applicant: asString(row.applicantName || row.userName, `申请人${index + 1}`),
      catName: asString(row.catName, `猫咪${index + 1}`),
      catMeta: asString(row.catMeta || row.location, '软件园校区'),
      status,
      time: asString(row.createdAt || row.time, '刚刚提交'),
      reason: asString(row.reason),
    }
  })
}

export function AdminAdoptionsPage() {
  usePageTitle('领养申请审批')
  const query = useQuery({ queryKey: ['admin-adoptions'], queryFn: getAdminAdoptions })

  const items = useMemo(() => {
    const normalized = normalizeItems(query.data?.data)
    return normalized.length > 0 ? normalized : fallbackItems
  }, [query.data?.data])

  const counts = {
    all: items.length,
    pending: items.filter((item) => item.status === 'pending').length,
    review: items.filter((item) => item.status === 'review').length,
    approved: items.filter((item) => item.status === 'approved').length,
  }

  return (
    <div className="pb-8">
      <section className="mb-5 rounded-b-[24px] bg-white px-5 pb-5 pt-5 shadow-[0_2px_15px_rgba(0,0,0,0.04)]">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-[22px] font-bold text-[#2c3e50]">领养申请审批</h1>
          <span className="rounded-lg bg-[#f1f5f9] px-2 py-1 text-[11px] text-[#94a3b8]">
            <CalendarOutlined className="mr-1" />
            {new Date().toLocaleDateString('zh-CN').replaceAll('/', '.')}
          </span>
        </div>

        <Input
          className="!h-12 !rounded-2xl !border-none !bg-[#f5f5f5]"
          placeholder="搜索申请单号、姓名或猫咪..."
          prefix={<SearchOutlined className="text-[#bdc3c7]" />}
        />
      </section>

      <div className="h5-content pt-0">
        <div className="chip-row mb-4 gap-2">
          {[
            ['全部申请', counts.all, true],
            ['待初审', counts.pending, false],
            ['待面谈', counts.review, false],
            ['待签约', counts.approved, false],
          ].map(([label, count, active]) => (
            <button
              key={String(label)}
              className={clsx(
                'min-w-[96px] rounded-xl border px-3 py-2 text-left shadow-[0_4px_10px_rgba(0,0,0,0.02)]',
                active ? 'border-transparent bg-[#66bb6a] text-white' : 'border-black/[0.03] bg-white text-[#2c3e50]',
              )}
              type="button"
            >
              <span className="block text-[18px] font-extrabold leading-none">{count as number}</span>
              <span className="mt-0.5 block text-[11px]">{label as string}</span>
            </button>
          ))}
        </div>

        <QueryState
          error={query.error}
          isEmpty={!query.isLoading && !query.error && items.length === 0}
          isLoading={query.isLoading}
          emptyDescription="暂无领养申请"
        >
          <div className="space-y-4">
            {items.map((item) => (
              <Link key={item.id} className="block" to={`/admin/adoptions/${item.id}`}>
                <div
                  className={clsx(
                    'rounded-[20px] border border-black/[0.03] bg-white p-4 shadow-[0_10px_20px_rgba(0,0,0,0.02)]',
                    item.status === 'pending' && 'border-l-4 border-l-[#ffa726]',
                    item.status === 'review' && 'border-l-4 border-l-[#26a69a]',
                    item.status === 'approved' && 'border-l-4 border-l-[#66bb6a]',
                    item.status === 'rejected' && 'border-l-4 border-l-[#bdc3c7]',
                  )}
                >
                  <div className="mb-3 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f1f5f9] text-[11px] text-[#475569]">
                      <UserOutlined />
                    </div>
                    <span className="text-[14px] font-bold text-[#2c3e50]">{item.applicant}</span>
                    <span
                      className={clsx(
                        'ml-auto rounded-xl px-2 py-1 text-[11px] font-bold',
                        item.status === 'pending' && 'bg-[#fff8e1] text-[#ffa000]',
                        item.status === 'review' && 'bg-[#eceff1] text-[#546e7a]',
                        item.status === 'approved' && 'bg-[#e8f5e9] text-[#2e7d32]',
                        item.status === 'rejected' && 'bg-[#f5f5f5] text-[#999]',
                      )}
                    >
                      {statusText[item.status]}
                    </span>
                  </div>

                  <div className="mb-3 flex gap-3 rounded-xl bg-[#f8fafc] p-3">
                    <div className="h-[50px] w-[50px] rounded-[10px] bg-gradient-to-br from-[#d1d5db] to-[#94a3b8]" />
                    <div className="flex-1">
                      <p className="text-[14px] font-bold text-[#2c3e50]">{item.catName}</p>
                      <p className="text-[11px] text-[#7f8c8d]">{item.catMeta}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[12px] text-[#7f8c8d]">
                    <span className={item.status === 'rejected' ? 'text-[#d32f2f]' : ''}>
                      <ClockCircleOutlined className="mr-1" />
                      {item.reason || item.time}
                    </span>
                    <span className="text-[#e2e8f0]">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </QueryState>
      </div>
    </div>
  )
}
