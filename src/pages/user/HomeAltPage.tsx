import { BellOutlined, EnvironmentOutlined, SearchOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Badge, Input, Tag } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { getCats } from '@/api/endpoints/cats'
import { QueryState } from '@/components/feedback/QueryState'
import { useCampus } from '@/hooks/useCampus'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asArray, asRecord, asString } from '@/utils/format'

const campusLabelMap: Record<string, string> = {
  CENTRAL: '济南中心校区',
  SOFTWARE_PARK: '软件园校区',
}

const campusApiCodeMap: Record<string, number> = {
  CENTRAL: 0,
  SOFTWARE_PARK: 5,
}

const colorOptions = [
  { label: '全部', value: '' },
  { label: '橘白', value: '橘白' },
  { label: '三花', value: '三花' },
  { label: '奶牛', value: '奶牛' },
] as const

export function HomeAltPage() {
  usePageTitle('首页（版本 B）')
  const { campus } = useCampus()
  const [keywordInput, setKeywordInput] = useState('')
  const [keyword, setKeyword] = useState('')
  const [activeColor, setActiveColor] = useState<(typeof colorOptions)[number]['value']>('')

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setKeyword(keywordInput.trim())
    }, 300)
    return () => window.clearTimeout(timer)
  }, [keywordInput])

  const query = useQuery({
    queryKey: ['cats-alt', campus, keyword],
    queryFn: () =>
      getCats({
        page: 1,
        pageSize: 20,
        campus: campusApiCodeMap[campus],
        search: keyword || undefined,
      }),
  })

  const rawItems = query.data?.data?.items ?? []
  const items = useMemo(() => {
    const normalizedKeyword = keyword.toLowerCase()
    return rawItems.filter((cat) => {
      const row = asRecord(cat)
      const name = asString(row.name, '')
      const location = asString(row.locationName, asString(row.campus, ''))
      const color = asString(row.color, '')
      const tags = asArray<string>(row.tags)

      const matchesColor =
        !activeColor || color.includes(activeColor) || tags.some((tag) => asString(tag, '').includes(activeColor))
      if (!matchesColor) {
        return false
      }

      if (!normalizedKeyword) {
        return true
      }

      const haystack = [name, location, color, ...tags].join(' ').toLowerCase()
      return haystack.includes(normalizedKeyword)
    })
  }, [activeColor, keyword, rawItems])
  const total = activeColor || keyword ? items.length : (query.data?.data?.total ?? rawItems.length)

  return (
    <div className="h5-content pb-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] text-[#999]">当前校区</p>
          <p className="mt-1 text-[16px] font-bold">{campusLabelMap[campus] ?? '未知校区'}</p>
        </div>
        <Badge dot>
          <button className="top-icon-btn" type="button">
            <BellOutlined />
          </button>
        </Badge>
      </div>

      <Input
        className="!mb-4 !h-11 !rounded-full !border-none !bg-white"
        value={keywordInput}
        placeholder="搜索猫咪、地点或标签..."
        prefix={<SearchOutlined className="text-[#999]" />}
        onChange={(event) => setKeywordInput(event.target.value)}
      />

      <section className="mb-4 rounded-[24px] bg-gradient-to-br from-[#4fc3f7] to-[#0288d1] p-5 text-white shadow-[0_10px_20px_rgba(2,136,209,0.3)]">
        <p className="text-[34px] font-extrabold leading-none">{total} <span className="text-[12px] font-medium">只</span></p>
        <p className="mt-1 text-[12px] text-white/90">猫校友累计记录</p>
        <p className="mt-3 inline-block rounded-lg bg-white/20 px-2 py-1 text-[10px]">数据实时来自后端接口</p>
      </section>

      <div className="chip-row mb-4">
        {['全部', '橘白', '三花', '奶牛'].map((item, index) => (
          <button
            key={item}
            className={(index === 0 ? '' : item) === activeColor ? 'chip-item chip-item-active' : 'chip-item'}
            type="button"
            onClick={() => setActiveColor((index === 0 ? '' : item) as (typeof colorOptions)[number]['value'])}
          >
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
            const avatar = asString(row.avatar, '')
            return (
              <Link key={id} className="overflow-hidden rounded-[16px] bg-white shadow-[0_8px_16px_rgba(0,0,0,0.06)]" to={`/user/cats/${id}`}>
                <div
                  className="h-36 bg-gradient-to-br from-[#d1d5db] to-[#94a3b8]"
                  style={avatar ? { backgroundImage: `url(${avatar})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
                />
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
                    {asString(row.locationName, asString(row.campus, campusLabelMap[campus] ?? '未知地点'))}
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
