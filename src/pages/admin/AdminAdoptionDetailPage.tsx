import { ArrowLeftOutlined, CalendarOutlined, HomeOutlined } from '@ant-design/icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button, message } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'

import { ApiNotFoundError } from '@/api/adapters/errors'
import { auditAdoption, getAdminAdoptions, scheduleAdoption } from '@/api/endpoints/adoptions'
import { ApiUnavailable } from '@/components/feedback/ApiUnavailable'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'

export function AdminAdoptionDetailPage() {
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
