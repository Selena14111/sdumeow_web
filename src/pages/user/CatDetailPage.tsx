import {
  ArrowLeftOutlined,
  CameraOutlined,
  EnvironmentOutlined,
  ExclamationCircleFilled,
  GiftOutlined,
  HeartFilled,
} from '@ant-design/icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button, Progress, message } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'

import { feedCat, getCatDetail } from '@/api/endpoints/cats'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asRecord, asString } from '@/utils/format'

export function CatDetailPage() {
  usePageTitle('猫咪详情')
  const navigate = useNavigate()
  const { id = '1' } = useParams()

  const detailQuery = useQuery({
    queryKey: ['cat-detail', id],
    queryFn: () => getCatDetail(id),
  })

  const feedMutation = useMutation({
    mutationFn: () => feedCat(id),
    onSuccess: () => message.success('投喂成功，人气 +1'),
    onError: (error) => message.error(error instanceof Error ? error.message : '投喂失败'),
  })

  const detail = asRecord(detailQuery.data?.data)
  const catName = asString(detail.name, '麻薯')

  return (
    <div className="pb-[110px]">
      <div className="relative h-[320px] overflow-hidden rounded-b-[30px] bg-gradient-to-br from-[#9ea7b7] to-[#667084]">
        <button
          className="absolute left-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/20 text-white backdrop-blur"
          type="button"
          onClick={() => navigate(-1)}
        >
          <ArrowLeftOutlined />
        </button>
      </div>

      <div className="-mt-12 px-5">
        <QueryState error={detailQuery.error} isLoading={detailQuery.isLoading}>
          <section className="rounded-[22px] bg-white p-4 shadow-[0_10px_24px_rgba(0,0,0,0.08)]">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#e8f5e9] px-3 py-1 text-[12px] font-semibold text-[#2e7d32]">
                  🏫 在校生（本科）
                </span>
                <h1 className="mt-2 text-[28px] font-extrabold text-[#1a1a1a]">
                  {catName}
                  <HeartFilled className="ml-2 text-[16px] text-[#ff8a80]" />
                </h1>
                <p className="mt-1 text-[12px] text-[#999]">2023-11-13 已绝育（剪耳）</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#fff8e1] text-[22px]">🐱</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-[#f8f9fa] p-3">
                <p className="text-[10px] text-[#999]">学历/编制</p>
                <p className="mt-1 text-[14px] font-bold text-[#333]">保安大队</p>
              </div>
              <div className="rounded-2xl bg-[#f8f9fa] p-3">
                <p className="text-[10px] text-[#999]">常驻据点</p>
                <p className="mt-1 text-[14px] font-bold text-[#333]">软件园校门</p>
              </div>
            </div>

            <div className="mt-4 border-t border-[#eee] pt-4">
              <h3 className="mb-3 text-[14px] font-bold">猫格属性</h3>
              {[['亲人指数', 90, '#ff8a80'], ['贪吃指数', 95, '#ffd54f'], ['战斗力', 40, '#90caf9']].map(([label, percent, color]) => (
                <div key={String(label)} className="mb-2.5">
                  <div className="mb-1 flex items-center justify-between text-[12px] text-[#555]">
                    <span>{label}</span>
                    <span>{(Number(percent) / 10).toFixed(1)}</span>
                  </div>
                  <Progress percent={Number(percent)} showInfo={false} size={[0, 8]} strokeColor={String(color)} />
                </div>
              ))}
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-[#ffccd2] bg-[#ffebee] px-3 py-2 text-[12px] font-semibold text-[#c62828]">
                <ExclamationCircleFilled />
                高能预警：吃饭时请勿摸头，会哈气！
              </div>
            </div>
          </section>

          <section className="mt-4 rounded-[18px] bg-white p-4 shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
            <h3 className="mb-3 text-[16px] font-bold">喵际关系</h3>
            <div className="flex gap-5 overflow-x-auto pb-1">
              {['斑斑', '蛋奶'].map((name) => (
                <div key={name} className="min-w-[56px] text-center">
                  <div className="mx-auto h-12 w-12 rounded-full bg-gradient-to-br from-[#d1d5db] to-[#94a3b8]" />
                  <p className="mt-1 text-[12px] font-semibold">{name}</p>
                  <p className="text-[10px] text-[#999]">饭搭子</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-4">
            <h3 className="mb-3 text-[16px] font-bold">喵喵动态</h3>
            <div className="border-l-2 border-[#eee] pl-4">
              <div className="relative mb-4">
                <span className="absolute -left-[22px] top-3 h-3 w-3 rounded-full border-2 border-white bg-[#ffd54f]" />
                <div className="rounded-[16px] bg-white p-4 shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
                  <div className="mb-2 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-[#d1d5db] to-[#94a3b8]" />
                    <div>
                      <p className="text-[12px] font-semibold">爱吃鱼的猫</p>
                      <p className="text-[10px] text-[#999]">2小时前</p>
                    </div>
                  </div>
                  <p className="text-[13px] leading-5 text-[#333]">今天在校门口遇到{catName}站岗，给了个罐头，吃得好香！</p>
                  <div className="mt-3 h-28 rounded-lg bg-gradient-to-br from-[#d1d5db] to-[#94a3b8]" />
                </div>
              </div>
            </div>
          </section>
        </QueryState>
      </div>

      <div className="fixed bottom-4 left-1/2 z-30 flex w-[min(350px,calc(100%-24px))] -translate-x-1/2 gap-2 rounded-[20px] bg-white px-3 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.15)]">
        <button className="flex flex-1 items-center justify-center gap-1 rounded-full bg-[#fff3e0] py-2 text-[13px] font-semibold text-[#ef6c00]" type="button">
          <CameraOutlined />
          发动态
        </button>
        <Button
          block
          className="!h-[38px] !flex-[1.4] !rounded-full !border-none !bg-[#ffd54f] !text-[13px] !font-semibold !text-[#1a1a1a]"
          icon={<GiftOutlined />}
          loading={feedMutation.isPending}
          onClick={() => feedMutation.mutate()}
          type="primary"
        >
          投喂（3）
        </Button>
      </div>

      <p className="mt-4 flex items-center justify-center gap-1 text-[11px] text-[#999]">
        <EnvironmentOutlined />
        软件园校区 · 食堂北门
      </p>
    </div>
  )
}
