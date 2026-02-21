import { ArrowLeftOutlined } from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import { Button, message } from 'antd'
import clsx from 'clsx'
import { useNavigate } from 'react-router-dom'

import badgeBroadcaster from '@/assets/\u5fbd\u7ae0-\u4f20\u64ad\u5927\u4f7f.png'
import badgeFirstMeet from '@/assets/\u5fbd\u7ae0-\u521d\u6b21\u89c1\u9762.png'
import badgeGuardian from '@/assets/\u5fbd\u7ae0-\u5b88\u62a4\u5929\u4f7f.png'
import badgeLeaderboard from '@/assets/\u5fbd\u7ae0-\u6253\u699c\u738b.png'
import badgeExplorer from '@/assets/\u5fbd\u7ae0-\u63a2\u7d22\u5bb6.png'
import badgePopularizer from '@/assets/\u5fbd\u7ae0-\u79d1\u666e\u8fbe\u4eba.png'
import badgeRecorder from '@/assets/\u5fbd\u7ae0-\u8bb0\u5f55\u8005.png'
import badgeAdopter from '@/assets/\u5fbd\u7ae0-\u9886\u517b\u4eba.png'
import appLogo from '@/assets/\u732b\u732b\u56fe\u9274-logo.png'
import { checkin } from '@/api/endpoints/user'
import { usePageTitle } from '@/hooks/usePageTitle'

type BadgeItem = {
  name: string
  desc: string
  icon: string
  unlocked: boolean
}

const badges: BadgeItem[] = [
  { name: '初次见面', desc: '首次投喂', icon: badgeFirstMeet, unlocked: true },
  { name: '记录者', desc: '发布5条动态', icon: badgeRecorder, unlocked: true },
  { name: '探索家', desc: '发现新猫咪', icon: badgeExplorer, unlocked: true },
  { name: '传播大使', desc: '分享10次', icon: badgeBroadcaster, unlocked: true },
  { name: '领养人', desc: '成功领养', icon: badgeAdopter, unlocked: false },
  { name: '打榜王', desc: '投喂榜Top3', icon: badgeLeaderboard, unlocked: false },
  { name: '守护天使', desc: '成功救助', icon: badgeGuardian, unlocked: false },
  { name: '科普达人', desc: '投稿被采纳', icon: badgePopularizer, unlocked: false },
  { name: '???', desc: '隐藏成就', icon: appLogo, unlocked: false },
]

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
        <div className="mx-auto mb-3 h-20 w-20">
          <img alt="SDU Meow logo" className="h-full w-full object-contain" src={appLogo} />
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
          {badges.map((badge) => (
            <div key={badge.name} className={clsx('text-center', !badge.unlocked && 'opacity-50 grayscale')}>
              <div
                className={clsx(
                  'mx-auto mb-2 flex h-20 w-[70px] items-center justify-center',
                  badge.unlocked
                    ? 'bg-gradient-to-br from-[#2a2a2a] to-[#444] shadow-[0_0_15px_rgba(255,213,79,0.2)]'
                    : 'bg-[#2a2a2a]',
                )}
                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
              >
                <img alt={badge.name} className="h-12 w-12 object-contain" src={badge.icon} />
              </div>
              <p className="text-[12px] font-semibold">{badge.name}</p>
              <p className="text-[10px] text-[#888]">{badge.desc}</p>
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
