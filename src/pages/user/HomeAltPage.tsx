import { BellOutlined, EnvironmentOutlined, SearchOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Badge, Input, Tag } from 'antd'
import { Link } from 'react-router-dom'

import { getCats } from '@/api/endpoints/cats'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asArray, asRecord, asString, toPaged } from '@/utils/format'

export function HomeAltPage() {
  usePageTitle('首页（版本 B）')

  const query = useQuery({
    queryKey: ['cats-alt'],
    queryFn: () => getCats({ page: 1, pageSize: 8 }),
  })

  const items = toPaged<Record<string, unknown>>(query.data?.data).items

  return (
    <div className="h5-content pb-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] text-[#999]">当前校区</p>
          <p className="mt-1 text-[16px] font-bold">济南中心校区</p>
        </div>
        <Badge dot>
          <button className="top-icon-btn" type="button">
            <BellOutlined />
          </button>
        </Badge>
      </div>

      <Input
        className="!mb-4 !h-11 !rounded-full !border-none !bg-white"
        placeholder="搜索猫咪、地点或标签..."
        prefix={<SearchOutlined className="text-[#999]" />}
      />

      <section className="mb-4 rounded-[24px] bg-gradient-to-br from-[#4fc3f7] to-[#0288d1] p-5 text-white shadow-[0_10px_20px_rgba(2,136,209,0.3)]">
        <p className="text-[34px] font-extrabold leading-none">363 <span className="text-[12px] font-medium">只</span></p>
        <p className="mt-1 text-[12px] text-white/90">猫校友累计记录</p>
        <p className="mt-3 inline-block rounded-lg bg-white/20 px-2 py-1 text-[10px]">已绝育 142 只流浪喵</p>
      </section>

      <div className="chip-row mb-4">
        {['全部', '橘白', '三花', '奶牛'].map((item, index) => (
          <button key={item} className={`${index === 0 ? 'chip-item chip-item-active' : 'chip-item'}`} type="button">
            {item}
          </button>
        ))}
      </div>

      <QueryState error={query.error} isEmpty={!items.length} isLoading={query.isLoading}>
        <div className="grid grid-cols-2 gap-3">
          {items.slice(0, 6).map((cat, index) => {
            const row = asRecord(cat)
            const id = asString(row.id, String(index + 1))
            const tags = asArray<string>(row.tags)
            return (
              <Link key={id} className="overflow-hidden rounded-[16px] bg-white shadow-[0_8px_16px_rgba(0,0,0,0.06)]" to={`/user/cats/${id}`}>
                <div className="h-36 bg-gradient-to-br from-[#d1d5db] to-[#94a3b8]" />
                <div className="p-3">
                  <p className="text-[14px] font-bold text-[#1a1a1a]">{asString(row.name, `猫咪${index + 1}`)}</p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {(tags.length ? tags : ['在校']).slice(0, 2).map((tag) => (
                      <Tag key={tag} className="!m-0 !rounded-md !px-1.5 !py-0 !text-[10px]">
                        {tag}
                      </Tag>
                    ))}
                  </div>
                  <p className="mt-1.5 flex items-center gap-1 text-[10px] text-[#999]">
                    <EnvironmentOutlined />
                    软件园校门
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      </QueryState>
    </div>
  )
}
