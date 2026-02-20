import { SearchOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Card, Input, Segmented, Tag } from 'antd'
import { Link } from 'react-router-dom'

import { getAdminAdoptions } from '@/api/endpoints/adoptions'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asRecord, toPaged } from '@/utils/format'

export function AdminAdoptionsPage() {
  usePageTitle('领养申请审批')
  const query = useQuery({ queryKey: ['admin-adoptions'], queryFn: getAdminAdoptions })
  const items = toPaged<Record<string, unknown>>(query.data?.data).items

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-[#f3f4f6] px-5 pb-24 pt-4">
      <h1 className="mb-4 text-5xl font-black text-[#263245]">领养申请审批</h1>
      <Input
        className="!mb-4 !h-12 !rounded-full !border-none !bg-[#ececec]"
        placeholder="搜索申请单号、姓名或猫咪..."
        prefix={<SearchOutlined className="text-slate-400" />}
      />

      <div className="mb-4 grid grid-cols-3 gap-3">
        <Card className="!rounded-2xl !border-none !bg-[#65bc69] !text-white" size="small">
          <p className="text-5xl font-black">12</p>
          <p className="text-sm">全部申请</p>
        </Card>
        <Card className="!rounded-2xl !border-none" size="small">
          <p className="text-5xl font-black">3</p>
          <p className="text-sm text-[#9ca3af]">待初审</p>
        </Card>
        <Card className="!rounded-2xl !border-none" size="small">
          <p className="text-5xl font-black">5</p>
          <p className="text-sm text-[#9ca3af]">已拒绝</p>
        </Card>
      </div>

      <Segmented
        block
        className="!mb-3"
        options={[
          { label: '全部', value: 'all' },
          { label: '待初审', value: 'pending' },
          { label: '已通过', value: 'approved' },
          { label: '已拒绝', value: 'rejected' },
        ]}
        value="all"
      />

      <QueryState error={query.error} isLoading={query.isLoading}>
        <div className="space-y-3">
          {items.slice(0, 6).map((item, index) => {
            const record = asRecord(item)
            const id = String(record.id ?? index + 1)
            return (
              <Link key={id} to={`/admin/adoptions/${id}`}>
                <Card className="!rounded-3xl !border-none" size="small">
                  <div className="mb-2 flex items-center justify-between">
                    <b className="text-3xl text-[#263247]">申请人 #{id}</b>
                    <Tag color={index % 2 === 0 ? 'gold' : 'green'}>{index % 2 === 0 ? '待初审' : '已通过'}</Tag>
                  </div>
                  <div className="rounded-2xl bg-[#f5f7fb] p-3">
                    <p className="text-3xl font-black">麻薯</p>
                    <p className="mt-1 text-sm text-[#8f98a8]">软件园校区 · 三花 · ♀</p>
                    <p className="mt-1 text-sm text-[#8f98a8]">亲人 · 吃货</p>
                  </div>
                </Card>
              </Link>
            )
          })}
        </div>
      </QueryState>
    </div>
  )
}
