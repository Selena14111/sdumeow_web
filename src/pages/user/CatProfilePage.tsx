import { ArrowLeftOutlined, EditOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Button, Progress } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'

import { getCatDetail } from '@/api/endpoints/cats'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asRecord, asString } from '@/utils/format'

function toPercent(value?: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0
  }

  const normalized = value <= 1 ? value * 100 : value
  return Math.max(0, Math.min(100, Math.round(normalized)))
}

function toDateLabel(value?: string): string {
  if (!value) {
    return '未知'
  }

  return value.slice(0, 10)
}

function toYearsLabel(dateString?: string): string {
  if (!dateString) {
    return '未知'
  }

  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) {
    return '未知'
  }

  const years = Math.max(0, new Date().getFullYear() - date.getFullYear())
  return `${years} 年`
}

export function CatProfilePageLegacy() {
  usePageTitle('猫咪详细档案')
  const navigate = useNavigate()
  const { id = '1' } = useParams()
  const query = useQuery({
    queryKey: ['cat-profile', id],
    queryFn: () => getCatDetail(id),
  })

  const detail = asRecord(query.data?.data)
  const name = asString(detail.name, '麻薯')

  return (
    <div className="pb-6">
      <section className="relative h-[280px] overflow-hidden rounded-b-[30px] bg-gradient-to-br from-[#80919e] to-[#394956] px-5 pt-5 text-white">
        <button className="top-icon-btn !bg-white/20 !text-white" type="button" onClick={() => navigate(-1)}>
          <ArrowLeftOutlined />
        </button>
        <div className="mt-14">
          <h1 className="text-[34px] font-extrabold leading-none">{name}</h1>
          <p className="mt-2 inline-flex rounded-full bg-[#4cc06f] px-3 py-1 text-[12px] font-semibold">在校生（保安大队）</p>
        </div>
      </section>

      <div className="-mt-8 px-5">
        <QueryState error={query.error} isLoading={query.isLoading}>
          <div className="mb-3 grid grid-cols-2 gap-3">
            {[
              ['花色品种', '三花'],
              ['常驻据点', '软件园内'],
              ['防护等级', '已绝育'],
              ['录入时长', '1.5 年'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[18px] bg-white p-3 shadow-[0_8px_18px_rgba(0,0,0,0.06)]">
                <p className="text-[11px] text-[#9ca3af]">{label}</p>
                <p className="mt-1 text-[18px] font-bold text-[#1d2433]">{value}</p>
              </div>
            ))}
          </div>

          <div className="mb-3 rounded-[18px] bg-white p-4 shadow-[0_8px_18px_rgba(0,0,0,0.06)]">
            <h3 className="mb-3 text-[16px] font-bold">核心数值</h3>
            <div className="space-y-2.5">
              {[['亲人指数', 90, '#87c98f'], ['贪吃指数', 95, '#f4cc45'], ['颜值指数', 99, '#e993c3'], ['战斗力', 40, '#7a889d']].map(
                ([title, value, color]) => (
                  <div key={String(title)}>
                    <div className="mb-1 flex items-center justify-between text-[12px] text-[#555]">
                      <span>{title}</span>
                      <span className="font-semibold">{value}%</span>
                    </div>
                    <Progress percent={Number(value)} showInfo={false} size={[0, 8]} strokeColor={String(color)} />
                  </div>
                ),
              )}
            </div>
            <p className="mt-3 rounded-xl border border-[#f3a8ae] bg-[#fff1f2] px-3 py-2 text-[12px] font-semibold text-[#d33646]">
              高能：吃饭时请勿摸头，会反击！
            </p>
          </div>

          <div className="mb-3 rounded-[18px] bg-white p-4 shadow-[0_8px_18px_rgba(0,0,0,0.06)]">
            <h3 className="mb-2 text-[16px] font-bold">最近用户评价</h3>
            <div className="space-y-2">
              {[1, 2].map((index) => (
                <div key={index} className="rounded-xl bg-[#f5f7fb] p-3 text-[13px] text-[#4b5563]">
                  <p className="mb-1 text-[13px] font-semibold text-[#1f2937]">爱吃鱼的猫</p>
                  今天在门口遇到{name}，给了冻干后一直跟着我走，超级可爱！
                </div>
              ))}
            </div>
          </div>

          <Button
            block
            className="!mb-2 !h-11 !rounded-full !border-none !bg-[#0fac6d] !font-semibold"
            icon={<EditOutlined />}
            type="primary"
          >
            编辑详细档案
          </Button>
          <Button block className="!h-11 !rounded-full !border-[#ff9faf] !text-[#ff4f68]">
            标记毕业
          </Button>
        </QueryState>
      </div>
    </div>
  )
}

export function CatProfilePage() {
  usePageTitle('猫咪详细档案')
  const navigate = useNavigate()
  const { id = '1' } = useParams()

  const query = useQuery({
    queryKey: ['cat-profile', id],
    queryFn: () => getCatDetail(id),
  })

  const detail = query.data?.data
  const basicInfo = detail?.basicInfo
  const attributes = detail?.attributes
  const name = detail?.name ?? '猫咪'
  const tags = detail?.tags ?? []
  const aliases = detail?.aliases ?? []
  const role = basicInfo?.role || '在校生'
  const stats = [
    { label: '花色品种', value: basicInfo?.color || '未知' },
    { label: '常驻据点', value: basicInfo?.hauntLocation || '未知' },
    { label: '绝育状态', value: basicInfo?.neutered?.isNeutered ? '已绝育' : '未绝育' },
    { label: '录入时长', value: toYearsLabel(basicInfo?.admissionDate) },
  ]
  const metricItems = [
    { label: '亲人指数', value: toPercent(attributes?.friendliness), color: '#87c98f' },
    { label: '贪吃指数', value: toPercent(attributes?.gluttony), color: '#f4cc45' },
    { label: '颜值指数', value: toPercent(attributes?.appearance), color: '#e993c3' },
    { label: '战斗力', value: toPercent(attributes?.fight), color: '#7a889d' },
  ]
  const description = detail?.description || '暂无档案描述'

  return (
    <div className="pb-6">
      <section className="relative h-[280px] overflow-hidden rounded-b-[30px] bg-gradient-to-br from-[#80919e] to-[#394956] px-5 pt-5 text-white">
        {detail?.avatar ? <img alt={name} className="absolute inset-0 h-full w-full object-cover opacity-30" src={detail.avatar} /> : null}
        <button className="top-icon-btn !bg-white/20 !text-white" type="button" onClick={() => navigate(-1)}>
          <ArrowLeftOutlined />
        </button>
        <div className="relative mt-14">
          <h1 className="text-[34px] font-extrabold leading-none">{name}</h1>
          <p className="mt-2 inline-flex rounded-full bg-[#4cc06f] px-3 py-1 text-[12px] font-semibold">{role}</p>
        </div>
      </section>

      <div className="-mt-8 px-5">
        <QueryState error={query.error} isLoading={query.isLoading}>
          <div className="mb-3 grid grid-cols-2 gap-3">
            {stats.map((item) => (
              <div key={item.label} className="rounded-[18px] bg-white p-3 shadow-[0_8px_18px_rgba(0,0,0,0.06)]">
                <p className="text-[11px] text-[#9ca3af]">{item.label}</p>
                <p className="mt-1 text-[18px] font-bold text-[#1d2433]">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="mb-3 rounded-[18px] bg-white p-4 shadow-[0_8px_18px_rgba(0,0,0,0.06)]">
            <h3 className="mb-3 text-[16px] font-bold">核心数值</h3>
            <div className="space-y-2.5">
              {metricItems.map((item) => (
                <div key={item.label}>
                  <div className="mb-1 flex items-center justify-between text-[12px] text-[#555]">
                    <span>{item.label}</span>
                    <span className="font-semibold">{item.value}%</span>
                  </div>
                  <Progress percent={item.value} showInfo={false} size={[0, 8]} strokeColor={item.color} />
                </div>
              ))}
            </div>
            <p className="mt-3 rounded-xl border border-[#f3a8ae] bg-[#fff1f2] px-3 py-2 text-[12px] font-semibold text-[#d33646]">
              最近出现：{toDateLabel(basicInfo?.lastSeenTime)}
            </p>
          </div>

          <div className="mb-3 rounded-[18px] bg-white p-4 shadow-[0_8px_18px_rgba(0,0,0,0.06)]">
            <h3 className="mb-2 text-[16px] font-bold">档案备注</h3>
            <p className="text-[13px] leading-6 text-[#4b5563]">{description}</p>
            {tags.length > 0 ? (
              <p className="mt-2 text-[12px] text-[#6b7280]">标签：{tags.join(' / ')}</p>
            ) : null}
            {aliases.length > 0 ? (
              <p className="mt-1 text-[12px] text-[#6b7280]">别名：{aliases.join(' / ')}</p>
            ) : null}
          </div>

          <Button block className="!mb-2 !h-11 !rounded-full !border-none !bg-[#0fac6d] !font-semibold" icon={<EditOutlined />} type="primary">
            编辑详细档案
          </Button>
          <Button block className="!h-11 !rounded-full !border-[#ff9faf] !text-[#ff4f68]">
            标记毕业
          </Button>
        </QueryState>
      </div>
    </div>
  )
}
