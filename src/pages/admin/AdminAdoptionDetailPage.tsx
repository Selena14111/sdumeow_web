import { ArrowLeftOutlined } from '@ant-design/icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button, Card, Space, Tag, message } from 'antd'
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
    mutationFn: () => scheduleAdoption(id, { time: new Date().toISOString(), location: '软件园服务中心' }),
    onSuccess: () => message.success('已提交面谈安排'),
    onError: (error) => message.error(error instanceof Error ? error.message : '安排失败'),
  })

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-[#f3f4f6] px-5 pb-24 pt-4">
      <div className="mb-4 rounded-b-3xl bg-white px-4 py-4">
        <div className="mb-2 flex items-center gap-3">
          <Button className="!h-9 !w-9" icon={<ArrowLeftOutlined />} shape="circle" onClick={() => navigate(-1)} />
          <h1 className="text-4xl font-black text-[#2c3648]">SDU202501210008</h1>
          <Tag className="!ml-auto" color="gold">待审核</Tag>
        </div>
      </div>

      <QueryState error={query.error} isLoading={query.isLoading}>
        <div className="space-y-4">
          <Card className="!rounded-3xl !border-none" title={<span className="text-2xl font-black text-[#687280]">申请人信息</span>}>
            <div className="mb-3 flex gap-3">
              <div className="h-16 w-16 rounded-full bg-slate-300" />
              <div>
                <p className="text-4xl font-black text-[#263247]">张同学</p>
                <p className="text-base text-[#8d96a5]">软件学院 · 2022级本科 · 计算机科学与技术</p>
                <Tag className="!mt-1" color="blue">Lv.3 资深铲屎官</Tag>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[#9ca3af]">学号</span><b>2022001234</b></div>
              <div className="flex justify-between"><span className="text-[#9ca3af]">联系方式</span><b>138****1234</b></div>
              <div className="flex justify-between"><span className="text-[#9ca3af]">微信号</span><b>zhangxx_2022</b></div>
            </div>
          </Card>

          <Card className="!rounded-3xl !border-none" title={<span className="text-2xl font-black text-[#687280]">申请详情</span>}>
            <div className="space-y-2 text-lg">
              <div className="flex justify-between"><span className="text-[#9ca3af]">居住情况</span><b>校外租房（整租）</b></div>
              <div className="flex justify-between"><span className="text-[#9ca3af]">养猫经验</span><b>有经验（家庭养猫3年）</b></div>
              <div className="flex justify-between"><span className="text-[#9ca3af]">目前宠物</span><b>无</b></div>
            </div>
            <div className="mt-3 rounded-2xl bg-[#f8f1d9] p-3 text-[#5c4e35]">
              我是一名软件学院的学生，对猫咪有丰富的照顾经验。希望能给麻薯一个温暖的家，会定期发送视频和照片反馈喂养情况。
            </div>
          </Card>

          <Card className="!rounded-3xl !border-none" title={<span className="text-2xl font-black text-[#687280]">审核记录</span>}>
            <div className="space-y-3 text-base">
              <div>● 提交申请 · 2025-01-21 14:30 · 张同学</div>
              <div>○ 协会审核 · 待处理</div>
              <div>○ 线下面谈 · 预约本周六 14:00</div>
              <div>○ 签订协议 · 面谈通过后签订</div>
            </div>
          </Card>
        </div>
      </QueryState>

      <Space className="mt-4 w-full" direction="vertical" size={10}>
        <div className="grid grid-cols-2 gap-3">
          <Button block className="!h-12 !rounded-2xl !border-none !bg-[#fcecef] !font-bold !text-[#d93b51]" loading={rejectMutation.isPending} onClick={() => rejectMutation.mutate()}>
            拒绝
          </Button>
          <Button block className="!h-12 !rounded-2xl !border-none !bg-[#f1f1f1] !font-bold" loading={approveMutation.isPending} onClick={() => approveMutation.mutate()}>
            通过
          </Button>
        </div>
        <Button block className="!h-12 !rounded-2xl !bg-[#f1f3f5] !font-bold" loading={scheduleMutation.isPending} onClick={() => scheduleMutation.mutate()}>
          要求补充材料
        </Button>
      </Space>

      {scheduleMutation.error instanceof ApiNotFoundError ? <div className="mt-3"><ApiUnavailable title="面谈安排接口暂不可用" /></div> : null}
    </div>
  )
}
