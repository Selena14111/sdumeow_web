import { ArrowLeftOutlined } from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import { Button, message } from 'antd'
import clsx from 'clsx'
import { useNavigate } from 'react-router-dom'

import { checkin } from '@/api/endpoints/user'
import { usePageTitle } from '@/hooks/usePageTitle'

const badges = [
  ['初次见面', '首次投喂', '💞', true],
  ['记录者', '发布5条动态', '📷', true],
  ['探索家', '发现新猫咪', '🔍', true],
  ['传播大使', '分享10次', '🔗', true],
  ['领养人', '成功领养', '👥', false],
  ['打榜王', '投喂榜Top3', '⭐', false],
  ['守护天使', '成功救助', '🧰', false],
  ['科普达人', '投稿被采纳', '🖊', false],
  ['???', '隐藏成就', '❔', false],
] as const

export function RewardsPage() {
  usePageTitle('荣誉勋章墙')
  const navigate = useNavigate()

  const checkinMutation = useMutation({
    mutationFn: checkin,
    onSuccess: () => message.success('签到成功，经验值 +5'),
    onError: (error) => message.error(error instanceof Error ? error.message : '签到失败'),
  })

  return (
    <div className="min-h-screen bg-[#1a1a1a] pb-8 text-white">
      <div className="px-5 pt-5">
        <button className="top-icon-btn !bg-transparent !text-white shadow-none" type="button" onClick={() => navigate(-1)}>
          <ArrowLeftOutlined />
        </button>
      </div>

      <header className="bg-[radial-gradient(circle_at_top,#333_0%,#1a1a1a_70%)] px-5 pb-7 pt-5 text-center">
        <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-[#ffd54f] text-[34px] text-[#3e2723] shadow-[0_0_30px_rgba(255,213,79,0.4)]">
          🏅
        </div>
        <h1 className="text-[24px] font-extrabold">荣誉勋章墙</h1>
        <p className="mt-1 text-[12px] text-[#ccc]">已点亮 4 / 9 枚勋章</p>
      </header>

      <div className="px-5">
        <section className="mb-5 rounded-[10px] bg-[#333] p-4">
          <div className="mb-2 flex items-center justify-between text-[12px]">
            <span>下一等级：黄金铲屎官</span>
            <span className="text-[#ffd54f]">320 / 500 经验</span>
          </div>
          <div className="h-2 overflow-hidden rounded bg-black">
            <div className="h-full w-[64%] bg-gradient-to-r from-[#ffd54f] to-[#ffa000]" />
          </div>
        </section>

        <section className="grid grid-cols-3 gap-y-5">
          {badges.map(([name, desc, icon, unlocked]) => (
            <div key={name} className={clsx('text-center', !unlocked && 'opacity-50 grayscale')}>
              <div
                className={clsx(
                  'mx-auto mb-2 flex h-20 w-[70px] items-center justify-center text-[30px]',
                  unlocked
                    ? 'bg-gradient-to-br from-[#2a2a2a] to-[#444] shadow-[0_0_15px_rgba(255,213,79,0.2)]'
                    : 'bg-[#2a2a2a]',
                )}
                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
              >
                {icon}
              </div>
              <p className="text-[12px] font-semibold">{name}</p>
              <p className="text-[10px] text-[#888]">{desc}</p>
            </div>
          ))}
        </section>

        <Button
          block
          className="!mt-7 !h-11 !rounded-full !border-none !bg-[#ffd54f] !font-semibold !text-[#1a1a1a]"
          loading={checkinMutation.isPending}
          onClick={() => checkinMutation.mutate()}
        >
          每日签到领取经验
        </Button>
      </div>
    </div>
  )
}
