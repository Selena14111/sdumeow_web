import { ArrowLeftOutlined, CalendarOutlined, HomeOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Modal, message } from 'antd'
import { useMemo } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { ApiError, ApiNotFoundError } from '@/api/adapters/errors'
import { auditAdoption, getAdminAdoptions, scheduleAdoption } from '@/api/endpoints/adoptions'
import { getCatDetail } from '@/api/endpoints/cats'
import { ApiUnavailable } from '@/components/feedback/ApiUnavailable'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asArray, asRecord, asString, formatTimestampText, toPaged } from '@/utils/format'

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
    onSuccess: () => message.success('已驳回申请'),
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
            <span className="mt-1 inline-block rounded-xl bg-[#fff8e1] px-2 py-1 text-[11px] font-bold text-[#ffa000]">待初审</span>
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

type AdoptionStage = 'pending' | 'interview' | 'approved' | 'rejected'

type AdoptionDetailView = {
  id: string
  userName: string
  userId: string
  catId: string
  catName: string
  catCampus: string
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
  pending: '待处理',
  interview: '待面谈',
  approved: '通过',
  rejected: '拒绝',
}

const stageBadgeClass: Record<AdoptionStage, string> = {
  pending: 'bg-[#fff8e1] text-[#ffa000]',
  interview: 'bg-[#e3f2fd] text-[#1565c0]',
  approved: 'bg-[#e8f5e9] text-[#2e7d32]',
  rejected: 'bg-[#ffebee] text-[#d32f2f]',
}

type AdoptionApiStatus = 'PENDING' | 'INTERVIEW' | 'APPROVED' | 'REJECTED'

const apiStatusByStage: Record<AdoptionStage, AdoptionApiStatus> = {
  pending: 'PENDING',
  interview: 'INTERVIEW',
  approved: 'APPROVED',
  rejected: 'REJECTED',
}

function normalizeApiStatusParam(value: string | null): AdoptionApiStatus | null {
  const status = (value ?? '').trim().toUpperCase()
  if (status === 'PENDING' || status === 'INTERVIEW' || status === 'APPROVED' || status === 'REJECTED') return status
  return null
}

function showAuditError(error: unknown) {
  const content = error instanceof Error ? error.message : '操作失败'

  if (error instanceof ApiError && error.shape.httpStatus === 400) {
    Modal.error({
      title: '无法更改申请状态',
      content,
      okText: '知道了',
    })
    return
  }

  message.error(content)
}

function toAdoptionStage(rawStatus: string): AdoptionStage {
  const status = rawStatus.trim().toUpperCase()

  if (status.includes('REJECT') || status.includes('REFUSE') || status.includes('DENY') || status.includes('驳回') || status.includes('拒绝')) {
    return 'rejected'
  }

  if (status.includes('INTERVIEW') || status.includes('MEETING') || status.includes('面谈')) {
    return 'interview'
  }

  if (
    status.includes('APPROV') ||
    status.includes('PASS') ||
    status.includes('ACCEPT') ||
    status.includes('COMPLETED') ||
    status.includes('通过')
  ) {
    return 'approved'
  }

  return 'pending'
}

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

const housingLabelMap: Record<string, string> = {
  RENT_WHOLE: '校外租房（整租）',
  RENT_SHARED: '校外租房（合租）',
  DORM: '学生宿舍',
  HOME: '家庭住房',
  OWN_HOME: '自有住房',
  OTHER: '其他',
}

const experienceLabelMap: Record<string, string> = {
  EXPERIENCED: '有经验',
  MULTI_CAT: '有经验',
  HAS_CATS: '有经验',
  HAS_PETS: '有经验',
  INEXPERIENCED: '无经验',
  NO_EXPERIENCE: '无经验',
  NO_CATS: '无经验',
  NEWBIE: '无经验',
  BEGINNER: '无经验',
  OTHER: '其他',
}

function normalizeCampus(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) return campusCodeToLabelMap[String(value)] ?? String(value)

  if (typeof value === 'string') {
    const campus = value.trim()
    if (!campus) return ''
    if (campus in campusCodeToLabelMap) return campusCodeToLabelMap[campus]
    const enumCampus = campus.toUpperCase()
    if (enumCampus in campusEnumToLabelMap) return campusEnumToLabelMap[enumCampus]
    return campus
  }

  return ''
}

function normalizeHousing(value: unknown): string {
  if (typeof value === 'string') {
    const raw = value.trim()
    if (!raw) return '--'
    const key = raw.toUpperCase()
    return housingLabelMap[key] ?? raw
  }
  return '--'
}

function normalizeExperience(value: unknown): string {
  if (typeof value === 'string') {
    const raw = value.trim()
    if (!raw) return '--'
    const key = raw.toUpperCase()
    return experienceLabelMap[key] ?? raw
  }
  return '--'
}

function normalizeAdoptionDetail(value: unknown, fallbackId: string, index = 0, fallbackStatus: AdoptionStage = 'pending'): AdoptionDetailView {
  const row = asRecord(value)
  const contact = asRecord(row.contact)
  const info = asRecord(row.info)
  const cat = asRecord(row.cat)
  const catInfo = asRecord(row.catInfo)
  const rawHousing = info.housing || row.housing || row.residence || row.living || row.liveCondition || row.housingSituation
  const rawExperience = info.experience || row.experience || row.petExperience || row.catExperience || row.experienceLevel

  return {
    id: asString(row.id, fallbackId || String(index + 1)),
    userName: asString(row.userName || row.applicantName, `申请人${index + 1}`),
    userId: String(row.userId ?? '--'),
    catId: asString(row.catId, ''),
    catName: asString(row.catName, '未知猫咪'),
    catCampus: normalizeCampus(row.catCampus || cat.campus || catInfo.campus || row.campus),
    catAvatar: asString(row.catAvatar, ''),
    status: toAdoptionStage(asString(row.status, fallbackStatus)),
    createTime: formatTimestampText(row.createTime || row.createdAt || row.time, '--'),
    reason: asString(row.reason),
    phone: asString(contact.phone, '--'),
    wechat: asString(contact.wechat, '--'),
    housing: normalizeHousing(rawHousing),
    experience: normalizeExperience(rawExperience),
    plan: asString(info.plan || row.plan, '--'),
    interviewTime: asString(row.interviewTime || row.scheduleTime || row.appointmentTime, '未安排'),
    interviewLocation: asString(row.interviewLocation || row.location, '待定'),
  }
}

export function AdminAdoptionDetailPage() {
  usePageTitle('领养申请详情')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { id = '' } = useParams()
  const [searchParams] = useSearchParams()
  const statusParam = normalizeApiStatusParam(searchParams.get('status'))

  const pendingQueryEnabled = !statusParam || statusParam === apiStatusByStage.pending
  const interviewQueryEnabled = !statusParam || statusParam === apiStatusByStage.interview
  const approvedQueryEnabled = !statusParam || statusParam === apiStatusByStage.approved
  const rejectedQueryEnabled = !statusParam || statusParam === apiStatusByStage.rejected

  const pendingQuery = useQuery({
    queryKey: ['admin-adoptions', 'detail', id, apiStatusByStage.pending],
    queryFn: () =>
      getAdminAdoptions({
        status: apiStatusByStage.pending,
        page: 1,
        size: 200,
      }),
    enabled: pendingQueryEnabled,
  })
  const interviewQuery = useQuery({
    queryKey: ['admin-adoptions', 'detail', id, apiStatusByStage.interview],
    queryFn: () =>
      getAdminAdoptions({
        status: apiStatusByStage.interview,
        page: 1,
        size: 200,
      }),
    enabled: interviewQueryEnabled,
  })
  const approvedQuery = useQuery({
    queryKey: ['admin-adoptions', 'detail', id, apiStatusByStage.approved],
    queryFn: () =>
      getAdminAdoptions({
        status: apiStatusByStage.approved,
        page: 1,
        size: 200,
      }),
    enabled: approvedQueryEnabled,
  })
  const rejectedQuery = useQuery({
    queryKey: ['admin-adoptions', 'detail', id, apiStatusByStage.rejected],
    queryFn: () =>
      getAdminAdoptions({
        status: apiStatusByStage.rejected,
        page: 1,
        size: 200,
      }),
    enabled: rejectedQueryEnabled,
  })

  const detail = useMemo(() => {
    const sources: Array<{ data: unknown; stage: AdoptionStage }> = [
      { data: pendingQuery.data?.data, stage: 'pending' },
      { data: interviewQuery.data?.data, stage: 'interview' },
      { data: approvedQuery.data?.data, stage: 'approved' },
      { data: rejectedQuery.data?.data, stage: 'rejected' },
    ]

    for (const source of sources) {
      const items = toPaged<Record<string, unknown>>(source.data).items
      const targetIndex = items.findIndex((item) => asString(asRecord(item).id) === id)
      if (targetIndex >= 0) {
        return normalizeAdoptionDetail(items[targetIndex], id, targetIndex, source.stage)
      }
    }

    return null
  }, [approvedQuery.data?.data, id, interviewQuery.data?.data, pendingQuery.data?.data, rejectedQuery.data?.data])

  const catQuery = useQuery({
    queryKey: ['cat-detail', detail?.catId],
    queryFn: () => getCatDetail(detail?.catId ?? ''),
    enabled: Boolean(detail?.catId),
  })

  const catRecord = asRecord(catQuery.data?.data)
  const catBasicInfo = asRecord(catRecord.basicInfo)
  const catCampus = normalizeCampus(catRecord.campus || catBasicInfo.campus || detail?.catCampus) || '未知校区'
  const catTags = asArray<string>(catRecord.tags).filter(Boolean)

  const refreshAdoptions = () => queryClient.invalidateQueries({ queryKey: ['admin-adoptions'] })
  const targetId = detail?.id || id

  const interviewMutation = useMutation({
    mutationFn: () => auditAdoption(targetId, { status: 'INTERVIEW', reason: '进入面谈' }),
    onSuccess: () => {
      void refreshAdoptions()
      navigate(`/admin/adoptions/${targetId}?status=INTERVIEW`, { replace: true })
      message.success('已进入待面谈')
    },
    onError: showAuditError,
  })

  const approveMutation = useMutation({
    mutationFn: () => auditAdoption(targetId, { status: 'APPROVED', reason: '审核通过' }),
    onSuccess: () => {
      void refreshAdoptions()
      navigate(`/admin/adoptions/${targetId}?status=APPROVED`, { replace: true })
      message.success('已通过申请')
    },
    onError: showAuditError,
  })

  const rejectMutation = useMutation({
    mutationFn: () => auditAdoption(targetId, { status: 'REJECTED', reason: '不符合领养要求' }),
    onSuccess: () => {
      void refreshAdoptions()
      navigate(`/admin/adoptions/${targetId}?status=REJECTED`, { replace: true })
      message.success('已驳回申请')
    },
    onError: showAuditError,
  })

  const detailQueryStates = [
    { enabled: pendingQueryEnabled, query: pendingQuery },
    { enabled: interviewQueryEnabled, query: interviewQuery },
    { enabled: approvedQueryEnabled, query: approvedQuery },
    { enabled: rejectedQueryEnabled, query: rejectedQuery },
  ]
  const enabledDetailQueries = detailQueryStates.filter((item) => item.enabled)
  const detailIsLoading = enabledDetailQueries.some(({ query }) => query.isLoading)
  const detailApiUnavailable =
    enabledDetailQueries.length > 0 && enabledDetailQueries.every(({ query }) => query.error instanceof ApiNotFoundError)
  const detailError = detailApiUnavailable ? null : enabledDetailQueries.find(({ query }) => query.error)?.query.error
  const refetchDetail = () => {
    enabledDetailQueries.forEach(({ query }) => {
      void query.refetch()
    })
  }

  const headerStageClass = detail ? stageBadgeClass[detail.status] : 'bg-[#f1f5f9] text-[#94a3b8]'
  const canMoveToInterview = detail?.status === 'pending'
  const canApprove = detail?.status === 'interview'

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-36">
      <section className="mb-5 rounded-b-[24px] bg-white px-5 pb-5 pt-5 shadow-[0_2px_15px_rgba(0,0,0,0.04)]">
        <div className="flex items-center">
          <button className="top-icon-btn !rounded-xl !bg-[#f5f5f5]" onClick={() => navigate(-1)} type="button">
            <ArrowLeftOutlined />
          </button>
          <div className="ml-3">
            <h1 className="text-[20px] font-bold text-[#2c3e50]">{detail?.catName || '未知猫咪'}</h1>
            <span className={`mt-1 inline-block rounded-xl px-2 py-1 text-[11px] font-bold ${headerStageClass}`}>
              {detail ? stageText[detail.status] : '加载中'}
            </span>
          </div>
        </div>
      </section>

      <div className="h5-content pt-0">
        <QueryState
          error={detailError}
          isEmpty={!detailIsLoading && !detailError && !detail}
          isLoading={detailIsLoading}
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
                    <p className="text-[12px] text-[#7f8c8d]">{catCampus}</p>
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

            </div>
          ) : null}
        </QueryState>

        {detailApiUnavailable ? (
          <div className="mt-4">
            <ApiUnavailable onRetry={refetchDetail} title="领养详情接口暂不可用，当前展示设计稿态" />
          </div>
        ) : null}
      </div>

      {detail ? (
        <div className="fixed bottom-6 left-1/2 z-30 w-[min(350px,calc(100%-34px))] -translate-x-1/2 rounded-3xl border border-white/40 bg-white/90 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.1)] backdrop-blur-xl">
          {canMoveToInterview ? (
            <div className="grid grid-cols-2 gap-3">
              <Button
                className="!h-12 !rounded-2xl !border-none !bg-[#fff1f2] !text-[14px] !font-bold !text-[#e11d48]"
                loading={rejectMutation.isPending}
                onClick={() => rejectMutation.mutate()}
                type="text"
              >
                拒绝申请
              </Button>
              <Button
                className="!h-12 !rounded-2xl !border-none !text-[14px] !font-bold !text-white"
                loading={interviewMutation.isPending}
                onClick={() => interviewMutation.mutate()}
                style={{ background: 'linear-gradient(135deg, #42A5F5 0%, #1565C0 100%)' }}
                type="text"
              >
                进入面谈
              </Button>
            </div>
          ) : canApprove ? (
            <div className="grid grid-cols-1 gap-3">
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
          ) : (
            <div className="rounded-2xl bg-[#f8fafc] px-4 py-3 text-center">
              <p className="text-[13px] font-bold text-[#475569]">{stageText[detail.status]}</p>
              <p className="mt-1 text-[12px] text-[#94a3b8]">该申请状态不可再更改</p>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
