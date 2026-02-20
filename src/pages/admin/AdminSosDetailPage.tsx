import {
  ArrowLeftOutlined,
  CheckCircleFilled,
  EnvironmentOutlined,
  PhoneFilled,
  ShareAltOutlined,
  VideoCameraFilled,
} from '@ant-design/icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button, message } from 'antd'
import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { getAdminSos, resolveSos } from '@/api/endpoints/sos'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asRecord, asString, toPaged } from '@/utils/format'

type SosDetail = {
  id: string
  catName: string
  location: string
  statusLabel: string
  publishedAt: string
  description: string
  reporterName: string
  reporterMeta: string
  reporterPhone: string
  media: Array<{ id: string; type: 'image' | 'video' }>
}

const fallbackDetail: SosDetail = {
  id: '1',
  catName: '未知猫咪（黑猫）',
  location: '软件园校区 · 食堂北门灌木丛',
  statusLabel: '紧急待处理',
  publishedAt: '12 分钟前发布',
  description:
    '发现时猫咪躲在食堂北门灌木丛深处，右后腿有明显贯穿伤，伤口仍在渗血。猫咪精神状态萎靡，对人的靠近有强烈哈气行为，无法直接上手。建议携带诱捕笼和加厚手套进行救助。',
  reporterName: '张子涵',
  reporterMeta: '软件学院 · 2022级本科生',
  reporterPhone: '13800000000',
  media: [
    { id: '1', type: 'image' },
    { id: '2', type: 'image' },
    { id: '3', type: 'video' },
  ],
}

function normalizeDetail(payload: unknown, id: string): SosDetail | null {
  const rawItems = Array.isArray(payload) ? payload : toPaged<Record<string, unknown>>(payload).items
  const found = rawItems.find((item, index) => {
    const row = asRecord(item)
    const currentId = asString(row.id, String(index + 1))
    return currentId === id
  })

  if (!found) return null

  const row = asRecord(found)
  const statusRaw = asString(row.status, '').toUpperCase()

  return {
    id,
    catName: asString(row.catName || row.cat, '未知猫咪'),
    location: asString(row.location || row.campus, '软件园校区'),
    statusLabel: ['RESOLVED', 'CLOSED', 'DONE'].includes(statusRaw) ? '已关闭' : '紧急待处理',
    publishedAt: asString(row.createdAt || row.time, '刚刚发布'),
    description: asString(
      row.description || row.symptom,
      '暂无详细描述，建议尽快联系求助人了解现场状况并安排同学前往处理。',
    ),
    reporterName: asString(row.reporterName || row.userName, '匿名同学'),
    reporterMeta: asString(row.reporterMeta || row.department, '山东大学在校生'),
    reporterPhone: asString(row.phone, '13800000000'),
    media: [
      { id: '1', type: 'image' },
      { id: '2', type: 'image' },
      { id: '3', type: 'video' },
    ],
  }
}

export function AdminSosDetailPage() {
  usePageTitle('SOS 详情')
  const navigate = useNavigate()
  const { id = '1' } = useParams()

  const query = useQuery({ queryKey: ['admin-sos', id], queryFn: getAdminSos })
  const detail = useMemo(() => normalizeDetail(query.data?.data, id) ?? fallbackDetail, [id, query.data?.data])

  const resolveMutation = useMutation({
    mutationFn: () => resolveSos(id, { status: 'RESOLVED', reply: '已安排协会同学到场处理' }),
    onSuccess: () => {
      message.success('已标记为解决')
      query.refetch()
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '处理失败，请稍后再试'),
  })

  return (
    <div className="min-h-screen bg-[#f1f5f9] pb-40">
      <div className="relative h-[320px] overflow-hidden bg-[#0f172a]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_40%),linear-gradient(180deg,#0f172a_5%,#334155_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-36 bg-gradient-to-t from-[#f1f5f9] to-transparent" />

        <div className="absolute left-5 right-5 top-6 z-20 flex items-center justify-between">
          <Button
            className="!h-11 !w-11 !border-white/20 !bg-white/20 !text-white backdrop-blur"
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate(-1)}
            shape="circle"
            type="text"
          />
          <Button
            className="!h-11 !w-11 !border-white/20 !bg-white/20 !text-white backdrop-blur"
            icon={<ShareAltOutlined />}
            shape="circle"
            type="text"
          />
        </div>

        <div className="absolute bottom-12 right-5 z-20 rounded-full border border-white/20 bg-[#0f172a]/60 px-3 py-1 text-[11px] font-extrabold text-white backdrop-blur">
          📷 1/4
        </div>
      </div>

      <QueryState error={query.error} isLoading={query.isLoading}>
        <section className="-mt-10 rounded-t-[40px] bg-white px-6 pb-8 pt-8 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
          <div className="mb-5 flex items-center justify-between">
            <span className="rounded-xl bg-[#fff1f2] px-4 py-1.5 text-[12px] font-extrabold text-[#e11d48]">
              {detail.statusLabel}
            </span>
            <span className="text-[12px] font-semibold text-[#94a3b8]">{detail.publishedAt}</span>
          </div>

          <h1 className="mb-2 text-[26px] font-black tracking-tight text-[#0f172a]">{detail.catName}</h1>
          <p className="mb-7 flex items-center gap-2 text-[14px] font-semibold text-[#64748b]">
            <EnvironmentOutlined className="text-[#e11d48]" />
            {detail.location}
          </p>

          <h2 className="mb-3 flex items-center gap-2 text-[16px] font-black text-[#0f172a] before:h-4 before:w-1 before:rounded before:bg-[#10b981] before:content-['']">
            异常情况描述
          </h2>
          <div className="mb-7 rounded-[28px] border border-[#f1f5f9] bg-[#f8fafc] px-5 py-5">
            <p className="text-[15px] font-medium leading-7 text-[#334155]">{detail.description}</p>
          </div>

          <h2 className="mb-3 flex items-center gap-2 text-[16px] font-black text-[#0f172a] before:h-4 before:w-1 before:rounded before:bg-[#10b981] before:content-['']">
            现场多媒体存证
          </h2>
          <div className="mb-8 grid grid-cols-3 gap-3">
            {detail.media.map((mediaItem) => (
              <div
                key={mediaItem.id}
                className="relative aspect-square overflow-hidden rounded-2xl border border-[#e2e8f0] bg-gradient-to-br from-[#e2e8f0] to-[#cbd5e1]"
              >
                {mediaItem.type === 'video' ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#0f172a]/45 text-xl text-white">
                    <VideoCameraFilled />
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          <h2 className="mb-3 flex items-center gap-2 text-[16px] font-black text-[#0f172a] before:h-4 before:w-1 before:rounded before:bg-[#10b981] before:content-['']">
            现场求助人信息
          </h2>
          <div className="flex items-center gap-4 rounded-3xl border border-[#e2e8f0] bg-[#f1f5f9] p-5">
            <div className="h-[52px] w-[52px] rounded-full border-2 border-white bg-gradient-to-br from-[#d1d5db] to-[#94a3b8] shadow-sm" />
            <div className="flex-1">
              <p className="text-[16px] font-black text-[#0f172a]">{detail.reporterName}</p>
              <p className="text-[12px] font-semibold text-[#64748b]">{detail.reporterMeta}</p>
            </div>
            <a
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[#10b981] shadow-[0_4px_12px_rgba(16,185,129,0.1)]"
              href={`tel:${detail.reporterPhone}`}
            >
              <PhoneFilled />
            </a>
          </div>
        </section>

        <div className="fixed bottom-6 left-1/2 z-30 flex w-[min(350px,calc(100%-34px))] -translate-x-1/2 gap-3 rounded-[30px] border border-white/40 bg-white/90 p-3 shadow-[0_15px_40px_rgba(0,0,0,0.12)] backdrop-blur-xl">
          <Button
            className="!h-14 !flex-[2] !rounded-[22px] !border-none !text-[15px] !font-black"
            icon={<CheckCircleFilled />}
            loading={resolveMutation.isPending}
            onClick={() => resolveMutation.mutate()}
            style={{
              background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
              color: '#fff',
              boxShadow: '0 8px 20px rgba(16, 185, 129, 0.25)',
            }}
            type="text"
          >
            标记为已解决
          </Button>
          <Button
            className="!h-14 !flex-1 !rounded-[22px] !border-none !bg-[#f1f5f9] !text-[15px] !font-black !text-[#475569]"
            onClick={() => navigate(-1)}
            type="text"
          >
            返回上级
          </Button>
        </div>
      </QueryState>
    </div>
  )
}
