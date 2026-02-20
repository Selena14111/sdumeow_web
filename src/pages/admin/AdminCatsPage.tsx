import { PlusOutlined, SearchOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Button, Card, Input, Segmented, Tag } from 'antd'
import { Link } from 'react-router-dom'

import { ApiNotFoundError } from '@/api/adapters/errors'
import { getAdminCats } from '@/api/endpoints/admin'
import { ApiUnavailable } from '@/components/feedback/ApiUnavailable'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'

const demoCats = [
  ['少妇', '待领养', '仲园喵'],
  ['Ctrl', '在校', '软件园'],
  ['麻薯', '已毕业', '三花 · 软件园'],
  ['大橘座', '在校', '橘猫 · 中心校区'],
  ['蛋奶', '在校', '奶牛 · 图书馆'],
  ['小黑', '待领养', '纯黑 · 软件园'],
]

export function AdminCatsPage() {
  usePageTitle('猫咪档案管理')
  const query = useQuery({ queryKey: ['admin-cats'], queryFn: getAdminCats })

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-[#f3f4f6] px-5 pb-24 pt-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-5xl font-black text-[#263246]">猫咪档案管理</h1>
        <Button className="!h-12 !w-12 !rounded-full !border-none !bg-[#f4cc45] !text-black" icon={<PlusOutlined />} />
      </div>

      <Input
        className="!mb-4 !h-12 !rounded-full !border-none !bg-[#ececec]"
        placeholder="搜索猫咪名字、花色或地点..."
        prefix={<SearchOutlined className="text-slate-400" />}
      />

      <Segmented
        block
        className="!mb-4"
        options={[
          { label: '全部', value: 'all' },
          { label: '待领养', value: 'pending' },
          { label: '在校', value: 'school' },
          { label: '已领养', value: 'adopted' },
          { label: '已毕业', value: 'graduated' },
        ]}
        value="all"
      />

      <QueryState error={query.error} isLoading={query.isLoading}>
        <div className="grid grid-cols-2 gap-3">
          {demoCats.map(([name, status, location], index) => (
            <Card key={name} className="!overflow-hidden !rounded-3xl !border-none" bodyStyle={{ padding: 0 }}>
              <div className="relative h-36 bg-slate-300">
                <Tag className="!absolute !right-2 !top-2 !rounded-full" color={status === '在校' ? 'green' : status === '已毕业' ? 'blue' : 'red'}>
                  {status}
                </Tag>
              </div>
              <div className="p-3">
                <p className="text-4xl font-black text-[#273348]">{name}</p>
                <p className="text-sm text-[#98a1b0]">{location}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  <Tag>{status}</Tag>
                  <Tag>{index % 2 === 0 ? '亲人' : '活泼'}</Tag>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Link to={`/admin/cats/${index + 1}/edit`}>
                    <Button block className="!rounded-xl !bg-[#fff3d4]">编辑</Button>
                  </Link>
                  <Button block className="!rounded-xl">详情</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </QueryState>

      {query.error instanceof ApiNotFoundError ? <div className="mt-4"><ApiUnavailable title="猫咪管理接口暂不可用，当前展示设计态" onRetry={() => query.refetch()} /></div> : null}
    </div>
  )
}
