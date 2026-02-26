import { ArrowLeftOutlined, CalendarOutlined, HomeOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, message } from 'antd'
import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { ApiNotFoundError } from '@/api/adapters/errors'
import { auditAdoption, getAdminAdoptions, scheduleAdoption } from '@/api/endpoints/adoptions'
import { getCatDetail } from '@/api/endpoints/cats'
import { ApiUnavailable } from '@/components/feedback/ApiUnavailable'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asArray, asRecord, asString, toPaged } from '@/utils/format'

export function AdminAdoptionDetailPageLegacy() {
  usePageTitle('领养申请详情')
  const navigate = useNavigate()
  const { id = '1' } = useParams()

  const query = useQuery({ queryKey: ['admin-adoptions', id], queryFn: getAdminAdoptions })

  const approveMutation = useMutation({
    mutationFn: () => auditAdoption(id, { status: 'APPROVED' }),
    onSuccess: () => message.success('已通过申请'),
    onError: (error) => message.error(error instanceof Error ? error.message : '操作失败'),
  })

  const rejectMutation = useMutation({
    mutationFn: () => auditAdoption(id, { status: 'REJECTED' }),
    onSuccess: () => message.success('已拒绝申请'),
    onError: (error) => message.error(error instanceof Error ? error.message : '操作失败'),
  })

  const scheduleMutation = useMutation({
    mutationFn: () => scheduleAdoption(id, { time: '本周六 14:00', location: '软件园校区学生服务中心' }),
    onSuccess: () => message.success('已安排面谈时间'),
    onError: (error) => message.error(error instanceof Error ? error.message : '安排失败'),
  })

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-36">
      <section className="mb-5 rounded-b-[24px] bg-white px-5 pb-5 pt-5 shadow-[0_2px_15px_rgba(0,0,0,0.04)]">
        <div className="flex items-center">
          <button className="top-icon-btn !rounded-xl !bg-[#f5f5f5]" onClick={() => navigate(-1)} type="button">
            <ArrowLeftOutlined />
          </button>
          <div className="ml-3">
            <h1 className="text-[20px] font-bold text-[#2c3e50]">SDU202501210008</h1>
            <span className="mt-1 inline-block rounded-xl bg-[#fff8e1] px-2 py-1 text-[11px] font-bold text-[#ffa000]">待审核</span>
          </div>
        </div>
      </section>

      <div className="h5-content pt-0">
        <div className="mb-4 rounded-[20px] bg-gradient-to-br from-[#ff9800] to-[#f57c00] p-4 text-white shadow-[0_8px_20px_rgba(245,124,0,0.3)]">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[15px] font-bold">面谈预约</p>
            <span className="rounded-lg bg-white/25 px-2 py-1 text-[11px] font-semibold">待确认</span>
          </div>
          <p className="text-[26px] font-extrabold">本周六 14:00</p>
          <p className="mt-2 flex items-center gap-2 text-[14px]">
            <HomeOutlined />
            软件园校区学生服务中心
          </p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <button className="rounded-xl border border-white/40 bg-white/20 py-2 text-[13px] font-semibold" type="button">
              确认时间
            </button>
            <button className="rounded-xl border border-white/40 bg-white/20 py-2 text-[13px] font-semibold" type="button">
              调整时间
            </button>
          </div>
        </div>

        <QueryState error={query.error} isLoading={query.isLoading}>
          <div className="space-y-4">
            <section className="rounded-[20px] bg-white p-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)]">
              <h2 className="mb-3 text-[14px] font-bold uppercase tracking-wide text-[#7f8c8d]">申请人信息</h2>
              <div className="mb-3 flex items-center gap-3">
                <div className="h-[60px] w-[60px] rounded-full bg-gradient-to-br from-[#d1d5db] to-[#94a3b8]" />
                <div className="flex-1">
                  <p className="text-[16px] font-bold text-[#2c3e50]">张同学</p>
                  <p className="text-[13px] text-[#7f8c8d]">软件学院 · 2022级本科生 · 计算机科学与技术</p>
                  <div className="mt-1 flex gap-2 text-[12px]">
                    <span className="rounded-md bg-[#eceff1] px-2 py-0.5 font-semibold text-[#546e7a]">Lv.3 资深铲屎官</span>
                    <span className="text-[#7f8c8d]">32 次投喂</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2 border-t border-[#f5f5f5] pt-2 text-[14px]">
                <div className="flex justify-between">
                  <span className="text-[#7f8c8d]">学号</span>
                  <b>2022001234</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7f8c8d]">联系方式</span>
                  <b>138****1234</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7f8c8d]">微信号</span>
                  <b>zhangxx_2022</b>
                </div>
              </div>
            </section>

            <section className="rounded-[20px] bg-white p-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)]">
              <h2 className="mb-3 text-[14px] font-bold uppercase tracking-wide text-[#7f8c8d]">申请目标</h2>
              <div className="flex gap-3">
                <div className="h-20 w-20 rounded-xl bg-gradient-to-br from-[#d1d5db] to-[#94a3b8]" />
                <div className="flex-1">
                  <p className="text-[15px] font-bold text-[#2c3e50]">麻薯（三花）</p>
                  <p className="text-[12px] text-[#7f8c8d]">软件园校区 · 已绝育</p>
                  <div className="mt-1 flex gap-1">
                    <span className="rounded-lg bg-[#ffebee] px-2 py-0.5 text-[10px] font-semibold text-[#d32f2f]">待领养</span>
                    <span className="rounded-lg bg-[#f5f5f5] px-2 py-0.5 text-[10px] text-[#666]">亲人</span>
                    <span className="rounded-lg bg-[#f5f5f5] px-2 py-0.5 text-[10px] text-[#666]">吃货</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-[20px] bg-white p-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)]">
              <h2 className="mb-3 text-[14px] font-bold uppercase tracking-wide text-[#7f8c8d]">申请详情</h2>
              <div className="space-y-2 text-[14px]">
                <div className="flex justify-between">
                  <span className="text-[#7f8c8d]">居住情况</span>
                  <b>校外租房（整租）</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7f8c8d]">养猫经验</span>
                  <b>有经验（家庭养猫 3 年）</b>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#7f8c8d]">目前宠物</span>
                  <b>无</b>
                </div>
              </div>
              <div className="mt-3 rounded-xl bg-[#fff8e1] p-3 text-[14px] leading-6 text-[#5d4037]">
                我是软件学院学生，对猫咪有较丰富的照顾经验。希望能给麻薯一个稳定、温暖的家，会定期反馈喂养情况并配合回访。
              </div>
            </section>

            <section className="rounded-[20px] bg-white p-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)]">
              <h2 className="mb-3 text-[14px] font-bold uppercase tracking-wide text-[#7f8c8d]">审核记录</h2>
              <div className="space-y-3 text-[13px] text-[#64748b]">
                <div className="rounded-xl bg-[#f8fafc] p-3">
                  <p className="font-semibold text-[#2c3e50]">提交申请</p>
                  <p>2025-01-21 09:36 · 张同学</p>
                </div>
                <div className="rounded-xl bg-[#f8fafc] p-3">
                  <p className="font-semibold text-[#2c3e50]">资料初审通过</p>
                  <p>2025-01-21 11:20 · 王学长</p>
                </div>
              </div>
            </section>
          </div>
        </QueryState>

        {query.error instanceof ApiNotFoundError ? (
          <div className="mt-4">
            <ApiUnavailable onRetry={() => query.refetch()} title="领养详情接口暂不可用，当前展示设计稿态" />
          </div>
        ) : null}
      </div>

      <div className="fixed bottom-6 left-1/2 z-30 w-[min(350px,calc(100%-34px))] -translate-x-1/2 rounded-3xl border border-white/40 bg-white/90 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.1)] backdrop-blur-xl">
        <div className="grid grid-cols-2 gap-3">
          <Button
            className="!h-12 !rounded-2xl !border-none !bg-[#fff1f2] !text-[14px] !font-bold !text-[#e11d48]"
            loading={rejectMutation.isPending}
            onClick={() => rejectMutation.mutate()}
            type="text"
          >
            驳回申请
          </Button>
          <Button
            className="!h-12 !rounded-2xl !border-none !text-[14px] !font-bold !text-white"
            loading={approveMutation.isPending}
            onClick={() => approveMutation.mutate()}
            style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}
            type="text"
          >
            通过申请
          </Button>
        </div>
        <Button
          className="!mt-2 !h-11 !w-full !rounded-xl !border-none !bg-[#f1f5f9] !text-[13px] !font-semibold !text-[#475569]"
          icon={<CalendarOutlined />}
          loading={scheduleMutation.isPending}
          onClick={() => scheduleMutation.mutate()}
          type="text"
        >
          安排线下面谈
        </Button>
      </div>
    </div>
  )
}

type AdoptionStage = 'pending' | 'review' | 'approved' | 'rejected'

type AdoptionDetailView = {
  id: string
  userName: string
  userId: string
  catId: string
  catName: string
  catAvatar: string
  status: AdoptionStage
  createTime: string
  reason: string
  phone: string
  wechat: string
  housing: string
  experience: string
  plan: string
  interviewTime: string
  interviewLocation: string
}

const stageText: Record<AdoptionStage, string> = {
  pending: '待审核',
  review: '待面谈',
  approved: '已通过',
  rejected: '已拒绝',
}

function toAdoptionStage(rawStatus: string): AdoptionStage {
  const status = rawStatus.toUpperCase()
  if (status === 'APPROVED') return 'approved'
  if (status === 'REJECTED') return 'rejected'
  if (status === 'INTERVIEW' || status === 'PROCESSING') return 'review'
  return 'pending'
}

function normalizeAdoptionDetail(value: unknown, fallbackId: string, index = 0): AdoptionDetailView {
  const row = asRecord(value)
  const contact = asRecord(row.contact)
  const info = asRecord(row.info)

  return {
    id: asString(row.id, fallbackId || String(index + 1)),
    userName: asString(row.userName || row.applicantName, `申请人${index + 1}`),
    userId: String(row.userId ?? '--'),
    catId: asString(row.catId, ''),
    catName: asString(row.catName, '未知猫咪'),
    catAvatar: asString(row.catAvatar, ''),
    status: toAdoptionStage(asString(row.status, 'PENDING')),
    createTime: asString(row.createTime || row.createdAt || row.time, '--'),
    reason: asString(row.reason),
    phone: asString(contact.phone, '--'),
    wechat: asString(contact.wechat, '--'),
    housing: asString(info.housing, '后端未返回'),
    experience: asString(info.experience, '后端未返回'),
    plan: asString(info.plan, '后端未返回'),
    interviewTime: asString(row.interviewTime || row.scheduleTime || row.appointmentTime, '未安排'),
    interviewLocation: asString(row.interviewLocation || row.location, '待定'),
  }
}

export function AdminAdoptionDetailPage() {
  usePageTitle('领养申请详情')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { id = '' } = useParams()

  const query = useQuery({
    queryKey: ['admin-adoptions', 'detail', id],
    queryFn: () =>
      getAdminAdoptions({
        page: 1,
        size: 200,
      }),
  })

  const detail = useMemo(() => {
    const items = toPaged<Record<string, unknown>>(query.data?.data).items
    const target = items.find((item) => asString(asRecord(item).id) === id)
    return target ? normalizeAdoptionDetail(target, id) : null
  }, [id, query.data?.data])

  const catQuery = useQuery({
    queryKey: ['cat-detail', detail?.catId],
    queryFn: () => getCatDetail(detail?.catId ?? ''),
    enabled: Boolean(detail?.catId),
  })

  const catRecord = asRecord(catQuery.data?.data)
  const catLocation = asString(catRecord.locationName || catRecord.hauntLocation || catRecord.campus, '未知区域')
  const catTags = asArray<string>(catRecord.tags).filter(Boolean)

  const refreshAdoptions = () => queryClient.invalidateQueries({ queryKey: ['admin-adoptions'] })
  const targetId = detail?.id || id

  const approveMutation = useMutation({
    mutationFn: () => auditAdoption(targetId, { status: 'APPROVED', reason: '审核通过' }),
    onSuccess: () => {
      void refreshAdoptions()
      message.success('已通过申请')
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '操作失败'),
  })

  const rejectMutation = useMutation({
    mutationFn: () => auditAdoption(targetId, { status: 'REJECTED', reason: '不符合领养要求' }),
    onSuccess: () => {
      void refreshAdoptions()
      message.success('已拒绝申请')
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '操作失败'),
  })

  const scheduleMutation = useMutation({
    mutationFn: () =>
      scheduleAdoption(targetId, {
        time: detail?.interviewTime === '未安排' ? '请联系申请人确认' : (detail?.interviewTime ?? '请联系申请人确认'),
        location: detail?.interviewLocation === '待定' ? '线下协商' : (detail?.interviewLocation ?? '线下协商'),
      }),
    onSuccess: () => {
      void refreshAdoptions()
      message.success('已提交面谈安排')
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '安排失败'),
  })

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-36">
      <section className="mb-5 rounded-b-[24px] bg-white px-5 pb-5 pt-5 shadow-[0_2px_15px_rgba(0,0,0,0.04)]">
        <div className="flex items-center">
          <button className="top-icon-btn !rounded-xl !bg-[#f5f5f5]" onClick={() => navigate(-1)} type="button">
            <ArrowLeftOutlined />
          </button>
          <div className="ml-3">
            <h1 className="text-[20px] font-bold text-[#2c3e50]">{detail?.id || id || '--'}</h1>
            <span className="mt-1 inline-block rounded-xl bg-[#fff8e1] px-2 py-1 text-[11px] font-bold text-[#ffa000]">
              {detail ? stageText[detail.status] : '加载中'}
            </span>
          </div>
        </div>
      </section>

      <div className="h5-content pt-0">
        <QueryState
          error={query.error}
          isEmpty={!query.isLoading && !query.error && !detail}
          isLoading={query.isLoading}
          emptyDescription="未找到该申请单"
        >
          {detail ? (
            <div className="space-y-4">
              <section className="rounded-[20px] bg-white p-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)]">
                <h2 className="mb-3 text-[14px] font-bold uppercase tracking-wide text-[#7f8c8d]">申请人信息</h2>
                <div className="space-y-2 text-[14px]">
                  <div className="flex justify-between">
                    <span className="text-[#7f8c8d]">姓名</span>
                    <b>{detail.userName}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7f8c8d]">UID</span>
                    <b>{detail.userId}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7f8c8d]">电话</span>
                    <b>{detail.phone}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7f8c8d]">微信</span>
                    <b>{detail.wechat}</b>
                  </div>
                </div>
              </section>

              <section className="rounded-[20px] bg-white p-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)]">
                <h2 className="mb-3 text-[14px] font-bold uppercase tracking-wide text-[#7f8c8d]">申请目标</h2>
                <div className="flex gap-3">
                  <div className="h-20 w-20 overflow-hidden rounded-xl bg-gradient-to-br from-[#d1d5db] to-[#94a3b8]">
                    {detail.catAvatar ? <img alt={detail.catName} className="h-full w-full object-cover" src={detail.catAvatar} /> : null}
                  </div>
                  <div className="flex-1">
                    <p className="text-[15px] font-bold text-[#2c3e50]">{detail.catName}</p>
                    <p className="text-[12px] text-[#7f8c8d]">{catLocation}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(catTags.length ? catTags : [stageText[detail.status]]).slice(0, 3).map((tag) => (
                        <span key={tag} className="rounded-lg bg-[#f5f5f5] px-2 py-0.5 text-[10px] text-[#666]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section className="rounded-[20px] bg-white p-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)]">
                <h2 className="mb-3 text-[14px] font-bold uppercase tracking-wide text-[#7f8c8d]">申请详情</h2>
                <div className="space-y-2 text-[14px]">
                  <div className="flex justify-between">
                    <span className="text-[#7f8c8d]">居住情况</span>
                    <b>{detail.housing}</b>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#7f8c8d]">养猫经验</span>
                    <b>{detail.experience}</b>
                  </div>
                </div>
                <div className="mt-3 rounded-xl bg-[#fff8e1] p-3 text-[14px] leading-6 text-[#5d4037]">{detail.plan}</div>
              </section>

              <section className="rounded-[20px] bg-white p-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)]">
                <h2 className="mb-3 text-[14px] font-bold uppercase tracking-wide text-[#7f8c8d]">审核记录</h2>
                <div className="space-y-3 text-[13px] text-[#64748b]">
                  <div className="rounded-xl bg-[#f8fafc] p-3">
                    <p className="font-semibold text-[#2c3e50]">提交申请</p>
                    <p>{detail.createTime}</p>
                  </div>
                  {detail.reason ? (
                    <div className="rounded-xl bg-[#f8fafc] p-3">
                      <p className="font-semibold text-[#2c3e50]">审核备注</p>
                      <p>{detail.reason}</p>
                    </div>
                  ) : null}
                  <div className="rounded-xl bg-[#f8fafc] p-3">
                    <p className="font-semibold text-[#2c3e50]">当前状态</p>
                    <p>{stageText[detail.status]}</p>
                  </div>
                </div>
              </section>

              <section className="rounded-[20px] bg-gradient-to-br from-[#ff9800] to-[#f57c00] p-4 text-white shadow-[0_8px_20px_rgba(245,124,0,0.3)]">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[15px] font-bold">面谈预约</p>
                  <span className="rounded-lg bg-white/25 px-2 py-1 text-[11px] font-semibold">{detail.interviewTime === '未安排' ? '待安排' : '已安排'}</span>
                </div>
                <p className="text-[20px] font-extrabold">{detail.interviewTime}</p>
                <p className="mt-2 flex items-center gap-2 text-[14px]">
                  <HomeOutlined />
                  {detail.interviewLocation}
                </p>
              </section>
            </div>
          ) : null}
        </QueryState>

        {query.error instanceof ApiNotFoundError ? (
          <div className="mt-4">
            <ApiUnavailable onRetry={() => query.refetch()} title="领养详情接口暂不可用，当前展示设计稿态" />
          </div>
        ) : null}
      </div>

      {detail ? (
        <div className="fixed bottom-6 left-1/2 z-30 w-[min(350px,calc(100%-34px))] -translate-x-1/2 rounded-3xl border border-white/40 bg-white/90 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.1)] backdrop-blur-xl">
          <div className="grid grid-cols-2 gap-3">
            <Button
              className="!h-12 !rounded-2xl !border-none !bg-[#fff1f2] !text-[14px] !font-bold !text-[#e11d48]"
              loading={rejectMutation.isPending}
              onClick={() => rejectMutation.mutate()}
              type="text"
            >
              驳回申请
            </Button>
            <Button
              className="!h-12 !rounded-2xl !border-none !text-[14px] !font-bold !text-white"
              loading={approveMutation.isPending}
              onClick={() => approveMutation.mutate()}
              style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}
              type="text"
            >
              通过申请
            </Button>
          </div>
          <Button
            className="!mt-2 !h-11 !w-full !rounded-xl !border-none !bg-[#f1f5f9] !text-[13px] !font-semibold !text-[#475569]"
            icon={<CalendarOutlined />}
            loading={scheduleMutation.isPending}
            onClick={() => scheduleMutation.mutate()}
            type="text"
          >
            安排线下面谈
          </Button>
        </div>
      ) : null}
    </div>
  )
}
