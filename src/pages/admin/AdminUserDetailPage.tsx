import { ArrowLeftOutlined } from '@ant-design/icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button, Card, message } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'

import { banAdminUser, getAdminUserDetail } from '@/api/endpoints/admin'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'

export function AdminUserDetailPage() {
  usePageTitle('用户详细档案')
  const navigate = useNavigate()
  const { id = '1' } = useParams()

  const query = useQuery({ queryKey: ['admin-user', id], queryFn: () => getAdminUserDetail(id) })

  const disableMutation = useMutation({
    mutationFn: () => banAdminUser(id, { action: 'BAN', reason: 'policy violation' }),
    onSuccess: () => message.success('账号状态已更新'),
    onError: (error) => message.error(error instanceof Error ? error.message : '操作失败'),
  })

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-[#f3f4f6] px-5 pb-24 pt-4">
      <div className="mb-4 flex items-center gap-3 rounded-b-3xl bg-white px-4 py-4">
        <Button className="!h-9 !w-9" icon={<ArrowLeftOutlined />} shape="circle" onClick={() => navigate(-1)} />
        <h1 className="text-4xl font-black text-[#2a3446]">用户详细档案</h1>
      </div>

      <QueryState error={query.error} isLoading={query.isLoading}>
        <Card className="!mb-4 !rounded-3xl !border-none">
          <div className="text-center">
            <div className="mx-auto mb-3 h-24 w-24 rounded-full bg-slate-300" />
            <h2 className="text-[44px] font-black text-[#2d394f]">爱吃鱼的猫 <span className="rounded-full bg-[#ffe8aa] px-2 py-1 text-sm text-[#c78e00]">Lv.3</span></h2>
            <p className="mt-1 text-lg text-[#95a0b0]">软件学院 · 2022级本科生</p>
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            {[
              ['32', '提供投喂'],
              ['5', '发现猫咪'],
              ['128', '获赞总数'],
            ].map(([value, label]) => (
              <div key={label}>
                <p className="text-4xl font-black text-[#2b3548]">{value}</p>
                <p className="text-sm text-[#9ca3af]">{label}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="!mb-4 !rounded-3xl !border-none" title={<span className="text-3xl font-black">账号基本信息</span>}>
          <div className="space-y-3 text-lg">
            <div className="flex justify-between"><span className="text-[#9ca3af]">学号/工号</span><b>202200301234</b></div>
            <div className="flex justify-between"><span className="text-[#9ca3af]">注册时间</span><b>2024-03-15</b></div>
            <div className="flex justify-between"><span className="text-[#9ca3af]">账号权限</span><b>普通用户</b></div>
          </div>
        </Card>

        <Card className="!mb-4 !rounded-3xl !border-none" title={<span className="text-3xl font-black">管理员操作</span>}>
          <Button block className="!mb-3 !h-12 !rounded-2xl !bg-[#ebf1f8] !font-bold !text-[#4b5d77]">
            提升为管理员权限
          </Button>
          <Button
            block
            danger
            className="!h-12 !rounded-2xl"
            loading={disableMutation.isPending}
            onClick={() => disableMutation.mutate()}
          >
            禁用此账号（封禁）
          </Button>
        </Card>
      </QueryState>
    </div>
  )
}
