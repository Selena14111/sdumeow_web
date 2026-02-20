import { SearchOutlined, RightOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Card, Input, Segmented } from 'antd'
import { Link } from 'react-router-dom'

import { getAdminUsers } from '@/api/endpoints/admin'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'

const demoUsers = ['爱吃鱼的猫', '张同学', '李同学', '王同学', '赵同学', '孙同学']

export function AdminUsersPage() {
  usePageTitle('用户管理')
  const query = useQuery({ queryKey: ['admin-users'], queryFn: getAdminUsers })

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-[#f3f4f6] px-5 pb-24 pt-4">
      <h1 className="mb-4 text-5xl font-black text-[#263245]">用户管理</h1>
      <Input className="!mb-4 !h-12 !rounded-full !border-none !bg-[#ececec]" placeholder="搜索用户名、学号、学院..." prefix={<SearchOutlined className="text-slate-400" />} />

      <div className="mb-4 grid grid-cols-2 gap-3">
        <Card className="!rounded-3xl !border-none !bg-[#2f3f5e] !text-white">
          <p className="text-6xl font-black">1,256</p>
          <p className="mt-1 text-base text-white/80">注册用户</p>
        </Card>
        <Card className="!rounded-3xl !border-none !bg-[#11b37f] !text-white">
          <p className="text-6xl font-black">89</p>
          <p className="mt-1 text-base text-white/80">本周新增</p>
        </Card>
      </div>

      <Segmented
        block
        className="!mb-3"
        options={[
          { label: '全部', value: 'all' },
          { label: '活跃用户', value: 'active' },
          { label: '管理员', value: 'admin' },
          { label: '已禁用', value: 'banned' },
        ]}
        value="all"
      />

      <QueryState error={query.error} isLoading={query.isLoading}>
        <div className="space-y-3">
          {demoUsers.map((name, index) => (
            <Link key={name} to={`/admin/users/${index + 1}`}>
              <Card className="!rounded-3xl !border-none" size="small">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-slate-300" />
                  <div className="flex-1">
                    <p className="text-3xl font-black text-[#243042]">{name}</p>
                    <p className="text-sm text-[#9ca3af]">软件学院 · 2022级</p>
                  </div>
                  <span className="rounded-full bg-[#ffe7a4] px-2 py-1 text-xs font-semibold text-[#b88700]">Lv.{(index % 5) + 1}</span>
                  <div className="rounded-xl bg-[#edf1f6] p-2 text-[#64748b]">
                    <RightOutlined />
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </QueryState>
    </div>
  )
}
