import { ArrowLeftOutlined, HeartFilled, QrcodeOutlined, RightOutlined } from '@ant-design/icons'
import { Modal } from 'antd'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import appLogo from '@/assets/猫猫图鉴-logo.png'
import { usePageTitle } from '@/hooks/usePageTitle'

type TeamGroup = {
  group: string
  names: string
}

// 从上到下依次为各小组；名字为占位，请替换为真实成员。
const teamGroups: TeamGroup[] = [
  { group: '开发团队', names: '学生在线网络文化工作室' },
  { group: '产品', names: '   ' },
  { group: '视觉', names: ' ' },
  { group: '美术', names: ' ' },
  { group: '前端', names: ' ' },
  { group: '后端', names: ' ' },
  { group: '移动', names: ' ' },
]

export function TeamPage() {
  usePageTitle('开发团队')
  const navigate = useNavigate()
  const [qrOpen, setQrOpen] = useState(false)

  return (
    <div className="h5-content pb-8">
      <div className="mb-5 flex items-center">
        <button className="top-icon-btn" type="button" onClick={() => navigate(-1)}>
          <ArrowLeftOutlined />
        </button>
        <h1 className="flex-1 text-center text-[18px] font-bold">开发团队</h1>
        <span className="w-9" />
      </div>

      <section className="mb-6 rounded-[24px] bg-gradient-to-br from-[#ffd54f] to-[#ffb300] p-5 text-[#5d4037] shadow-[0_10px_20px_rgba(255,179,0,0.22)]">
        <div className="flex items-center gap-4">
          <div className="h-28 w-28 flex-none overflow-hidden rounded-2xl bg-white/50 p-1.5">
            <img alt="SDU Meow logo" className="h-full w-full object-contain" src={appLogo} />
          </div>
          <div>
            <h2 className="text-[22px] font-extrabold leading-tight">SDU Meow</h2>
            <p className="mt-1 text-[13px] font-medium">校园猫咪管理平台 · 开发团队</p>
            <p className="mt-1 text-[12px] leading-relaxed text-[#5d4037]/80">
              建立山大流浪猫电子档案，普及科学喂养，提升救助效率,让每一份善意都有迹可循
            </p>
          </div>
        </div>
      </section>

      <button
        className="mb-3 flex w-full items-center justify-between rounded-[20px] bg-white px-4 py-3.5 shadow-[0_8px_18px_rgba(0,0,0,0.06)]"
        type="button"
        onClick={() => setQrOpen(true)}
      >
        <span className="text-[14px] font-bold text-[#333]">联系我们</span>
        <RightOutlined className="text-[12px] text-[#999]" />
      </button>
      <div className="divide-y divide-[#f0f0f0] rounded-[20px] bg-white px-4 shadow-[0_8px_18px_rgba(0,0,0,0.06)]">
        {teamGroups.map((item) => (
          <div key={item.group} className="flex items-center justify-between py-3.5">
            <span className="text-[14px] font-bold text-[#333]">{item.group}</span>
            <span className="text-[13px] text-[#999]">{item.names}</span>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-[20px] bg-white p-4 text-center shadow-[0_8px_18px_rgba(0,0,0,0.06)]">
        <p className="text-[13px] font-bold text-[#333]">
          <HeartFilled className="mr-1 text-[#ff6b6b]" />
          特别感谢
        </p>
        <p className="mt-2 text-[11px] leading-relaxed text-[#999]">
          感谢每一位为校园猫咪救助与领养事业付出努力的同学、志愿者与铲屎官们。
        </p>
        <p className="mt-3 text-[10px] text-[#ccc]">SDU Meow · 用代码守护每一只喵</p>
      </div>

      <Modal centered footer={null} open={qrOpen} title="联系我们" onCancel={() => setQrOpen(false)}>
        <div className="flex flex-col items-center py-2">
          <div className="flex aspect-square w-full max-w-[220px] flex-col items-center justify-center rounded-[16px] border border-dashed border-[#d9d9d9] bg-[#fafafa] text-[#bbb]">
            <QrcodeOutlined className="text-[40px]" />
            <span className="mt-2 text-[12px]">二维码区域</span>
          </div>
        </div>
      </Modal>
    </div>
  )
}
