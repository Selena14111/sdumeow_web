import { ArrowLeftOutlined, PhoneOutlined } from '@ant-design/icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button, Card, Tag, message } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'

import { getAdminSos, resolveSos } from '@/api/endpoints/sos'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'

export function AdminSosDetailPage() {
  usePageTitle('SOS 详情')
  const navigate = useNavigate()
  const { id = '1' } = useParams()

  const query = useQuery({ queryKey: ['admin-sos', id], queryFn: getAdminSos })

  const resolveMutation = useMutation({
    mutationFn: () => resolveSos(id, { status: 'RESOLVED', reply: '已安排协会同学前往救助' }),
    onSuccess: () => message.success('已标记为解决'),
    onError: (error) => message.error(error instanceof Error ? error.message : '操作失败'),
  })

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-[#dbe0e6] pb-24">
      <div className="relative h-72 bg-gradient-to-br from-[#c7c0aa] to-[#676f7a]">
        <Button className="!absolute !left-4 !top-4 !h-10 !w-10 !border-white/70 !bg-black/20 !text-white" icon={<ArrowLeftOutlined />} shape="circle" onClick={() => navigate(-1)} />
      </div>

      <div className="-mt-8 px-4">
        <QueryState error={query.error} isLoading={query.isLoading}>
          <Card className="!mb-4 !rounded-[30px] !border-none" size="small">
            <div className="mb-2 flex items-center justify-between">
              <Tag className="!rounded-full" color="magenta">紧急待处理</Tag>
              <span className="text-sm text-[#94a3b8]">12分钟前发布</span>
            </div>
            <h1 className="text-[52px] font-black text-[#1d2431]">未知猫咪（黑猫）</h1>
            <p className="mt-1 text-lg text-[#64748b]">软件园校区 · 食堂北门灌木丛</p>

            <h3 className="mt-4 text-2xl font-black">异常情况描述</h3>
            <div className="mt-2 rounded-2xl bg-[#f3f6fa] p-4 text-[#4b5563]">
              发现时猫咪躲在食堂北门的灌木丛深处，右后腿有明显贯穿伤，伤口仍在渗血。猫咪精神状态萎靡，对人的靠近有强烈哈气行为，无法直接上手。
            </div>

            <h3 className="mt-4 text-2xl font-black">现场多媒体存证</h3>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-20 rounded-2xl bg-slate-300" />
              ))}
            </div>

            <h3 className="mt-4 text-2xl font-black">现场求助人信息</h3>
            <div className="mt-2 flex items-center gap-3 rounded-2xl bg-[#f0f4f8] p-3">
              <div className="h-14 w-14 rounded-full bg-black" />
              <div className="flex-1">
                <p className="text-2xl font-black text-[#243247]">张子涵</p>
                <p className="text-sm text-[#7c8799]">软件学院 · 2022级本科生</p>
              </div>
              <Button className="!h-10 !w-10 !border-none !bg-[#e0f8ee] !text-[#0ea76f]" icon={<PhoneOutlined />} shape="circle" />
            </div>
          </Card>

          <div className="grid grid-cols-2 gap-3 rounded-3xl bg-white p-3 shadow-card">
            <Button
              block
              className="!h-12 !rounded-full !border-none !bg-[#10b981] !font-black !text-white"
              loading={resolveMutation.isPending}
              onClick={() => resolveMutation.mutate()}
              type="primary"
            >
              标记为已解决
            </Button>
            <Button block className="!h-12 !rounded-full !border-none !bg-[#edf2f7] !font-black !text-[#5f6b7c]" onClick={() => navigate(-1)}>
              返回上级
            </Button>
          </div>
        </QueryState>
      </div>
    </div>
  )
}
