import { CrownFilled, EditOutlined, FileTextOutlined, LogoutOutlined, OrderedListOutlined, RightOutlined, TrophyOutlined } from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { Button } from 'antd'
import { Link, useNavigate } from 'react-router-dom'

import { getMe } from '@/api/endpoints/user'
import { QueryState } from '@/components/feedback/QueryState'
import { useAuth } from '@/hooks/useAuth'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asRecord, asString } from '@/utils/format'
import { storage } from '@/utils/storage'

export function UserMePage() {
  usePageTitle('我的')
  const navigate = useNavigate()
  const { logout } = useAuth()
  const query = useQuery({ queryKey: ['me'], queryFn: getMe })

  const handleLogout = () => {
    storage.clearToken()
    logout()
    navigate('/login', { replace: true })
  }

  const profile = asRecord(query.data?.data)
  const nickname = asString(profile.nickname, '爱吃鱼的猫')
  const slogan = asString(profile.slogan, '软件学院 · 2022级本科')

  return (
    <QueryState error={query.error} isLoading={query.isLoading}>
      <section className="relative mb-10 rounded-b-[30px] bg-gradient-to-br from-[#ffd54f] to-[#ffb300] px-6 pb-20 pt-5 text-[#5d4037] shadow-[0_10px_20px_rgba(255,179,0,0.22)]">
        <div className="mb-3 flex justify-end">
          <Link
            className="inline-flex items-center gap-1 rounded-full border border-white/50 bg-white/25 px-3 py-1 text-[12px] font-semibold backdrop-blur"
            to="/user/me/edit"
          >
            <EditOutlined />
            编辑资料
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <div className="pr-3">
            <h1 className="text-[26px] font-extrabold leading-tight">{nickname}</h1>
            <p className="mt-1 text-[13px] font-medium">{slogan}</p>
            <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/35 px-2.5 py-1 text-[11px] font-bold">
              <CrownFilled />
              Lv.3 资深铲屎官
            </div>
          </div>
          <div className="h-20 w-20 flex-none rounded-full border-4 border-white/50 bg-gradient-to-br from-[#d1d5db] to-[#94a3b8]" />
        </div>

        <div className="absolute -bottom-9 left-5 right-5 grid grid-cols-3 rounded-[20px] bg-white px-3 py-4 text-center shadow-[0_15px_35px_rgba(0,0,0,0.08)]">
          {[
            ['32', '累计投喂'],
            ['5', '发现新猫'],
            ['128', '获赞认可'],
          ].map(([num, label]) => (
            <div key={label}>
              <p className="text-[22px] font-extrabold text-[#333]">{num}</p>
              <p className="text-[11px] text-[#999]">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="h5-content pt-0">
        <h3 className="mb-3 ml-1 text-[13px] text-[#999]">我的资产</h3>
        <div className="relative mb-6 overflow-hidden rounded-[24px] bg-gradient-to-r from-[#424242] to-[#212121] p-5 text-[#ffd54f] shadow-[0_10px_20px_rgba(0,0,0,0.18)]">
          <p className="text-[12px] opacity-80">小鱼干余额（积分）</p>
          <p className="mt-1 text-[36px] font-extrabold leading-none">850</p>
          <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-white/10 px-3 py-1 text-[11px]">
            兑换商城即将上线
            <RightOutlined className="text-[10px]" />
          </p>
          <span className="absolute -right-1 bottom-1 text-[56px] opacity-10">🐟</span>
        </div>

        <h3 className="mb-3 ml-1 text-[13px] text-[#999]">我的服务</h3>
        <div className="mb-5 grid grid-cols-2 gap-3">
          <Link className="relative rounded-[20px] bg-white p-4 shadow-[0_8px_18px_rgba(0,0,0,0.06)]" to="/user/adopt/apply">
            <span className="absolute right-3 top-3 rounded-md bg-[#e3f2fd] px-1.5 py-0.5 text-[10px] font-semibold text-[#2196f3]">审核中</span>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#ffebee] text-[#d32f2f]">
              <FileTextOutlined />
            </div>
            <p className="text-[15px] font-bold text-[#333]">领养申请</p>
            <p className="mt-1 text-[11px] text-[#999]">查看进度</p>
          </Link>

          <Link className="rounded-[20px] bg-white p-4 shadow-[0_8px_18px_rgba(0,0,0,0.06)]" to="/user/rewards">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff8e1] text-[#ffa000]">
              <TrophyOutlined />
            </div>
            <p className="text-[15px] font-bold text-[#333]">荣誉勋章</p>
            <p className="mt-1 text-[11px] text-[#999]">已点亮 4 枚</p>
          </Link>

          <Link className="relative rounded-[20px] bg-white p-4 shadow-[0_8px_18px_rgba(0,0,0,0.06)]" to="/user/me-center">
            <span className="absolute right-3 top-3 rounded-md bg-[#e3f2fd] px-1.5 py-0.5 text-[10px] font-semibold text-[#2196f3]">3</span>
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#e3f2fd] text-[#1976d2]">
              <OrderedListOutlined />
            </div>
            <p className="text-[15px] font-bold text-[#333]">我的申请</p>
            <p className="mt-1 text-[11px] text-[#999]">查看全部记录</p>
          </Link>
        </div>

        <Button
          block
          className="!h-12 !rounded-[15px] !border-none !bg-[#f5f5f5] !text-[14px] !font-semibold !text-[#999]"
          icon={<LogoutOutlined />}
          onClick={handleLogout}
        >
          退出登录
        </Button>
        <p className="mt-4 text-center text-[10px] text-[#ccc]">SDU Meow v2.4</p>
      </div>
    </QueryState>
  )
}
