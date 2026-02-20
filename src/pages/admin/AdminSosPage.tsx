import { useQuery } from '@tanstack/react-query'
import { Button, Card, Segmented } from 'antd'
import { Link } from 'react-router-dom'

import { getAdminSos } from '@/api/endpoints/sos'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asRecord, toPaged } from '@/utils/format'

export function AdminSosPage() {
  usePageTitle('SOS 紧急求助系统')
  const query = useQuery({ queryKey: ['admin-sos'], queryFn: getAdminSos })
  const items = toPaged<Record<string, unknown>>(query.data?.data).items

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-[#f3f4f6] px-5 pb-24 pt-4">
      <section className="mb-4 rounded-[28px] bg-[#f5f2e2] p-5">
        <h1 className="text-[46px] font-black leading-tight text-[#293548]">SOS 紧急求助系统</h1>
        <div className="mt-4 grid grid-cols-3 gap-3 text-center">
          {[
            ['2', '待处理', '#ffe8ef', 'text-[#e72a4e]'],
            ['5', '今日新增', '#edf2f9', 'text-[#55617a]'],
            ['12', '处理中', '#edf2f9', 'text-[#55617a]'],
          ].map(([value, label, bg, color]) => (
            <div key={label} className="rounded-3xl py-3" style={{ background: String(bg) }}>
              <p className={`text-5xl font-black ${color}`}>{value}</p>
              <p className="text-sm text-[#8f98a8]">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <Segmented
        block
        className="!mb-4"
        options={[
          { label: '全部求助', value: 'all' },
          { label: '已解决', value: 'resolved' },
          { label: '未解决', value: 'pending' },
        ]}
        value="all"
      />

      <QueryState error={query.error} isLoading={query.isLoading}>
        <div className="space-y-4">
          {items.slice(0, 3).map((item, index) => {
            const record = asRecord(item)
            const id = String(record.id ?? index + 1)
            return (
              <Link key={id} to={`/admin/sos/${id}`}>
                <Card className="!rounded-3xl !border-none" size="small">
                  <div className="mb-3 flex items-center gap-2">
                    <span className={`inline-block h-3 w-3 rounded-full ${index === 0 ? 'bg-[#ff3561]' : index === 1 ? 'bg-[#f2ab0f]' : 'bg-[#718096]'}`} />
                    <h3 className="text-4xl font-black text-[#293548]">{String(record.catName ?? '未知猫咪')}</h3>
                  </div>
                  <div className="mb-3 text-sm text-[#8f98a8]">
                    <div className="flex justify-between"><span>所属校区</span><b className="text-[#334155]">软件园校区</b></div>
                    <div className="flex justify-between"><span>求助症状</span><b className="text-[#df2f3e]">右后腿外伤出血，行动困难</b></div>
                  </div>

                  <div className="mb-3 rounded-2xl bg-[#f5f7fb] p-3 text-sm text-[#6b7280]">张子涵 · 软件学院 · 2022级本科生</div>

                  <div className="grid grid-cols-2 gap-3">
                    <Button block className="!h-11 !rounded-full !border-none !bg-[#10b981] !font-black !text-white">{index === 0 ? '受理' : '已解决'}</Button>
                    <Button block className="!h-11 !rounded-full !border-none !bg-[#eef1f5] !font-black !text-[#8091a7]">取消</Button>
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
