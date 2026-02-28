import {
  CameraOutlined,
  CrownFilled,
  InfoCircleOutlined,
  LogoutOutlined,
  RightOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons'
import { useQuery } from '@tanstack/react-query'
import { message } from 'antd'
import clsx from 'clsx'
import { useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { getMe } from '@/api/endpoints/user'
import { useAuth } from '@/hooks/useAuth'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asRecord, asString } from '@/utils/format'
import { storage } from '@/utils/storage'

const ADMIN_AVATAR_STORAGE_KEY = 'admin:me:avatar'

type SettingsRow = {
  title: string
  desc: string
  icon: ReactNode
  iconClassName: string
  onClick?: () => void
  rightNode?: ReactNode
}

export function AdminMePage() {
  usePageTitle('管理员中心')
  const navigate = useNavigate()
  const { logout, profile } = useAuth()
  const meQuery = useQuery({ queryKey: ['me', 'admin'], queryFn: getMe })
  const avatarInputId = 'admin-me-avatar-upload'
  const [avatarPreview, setAvatarPreview] = useState(() => {
    if (typeof window === 'undefined') return ''
    return window.localStorage.getItem(ADMIN_AVATAR_STORAGE_KEY) ?? ''
  })

  const onAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      message.warning('请选择图片文件')
      event.target.value = ''
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      message.warning('图片不能超过 5MB')
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = (loadEvent) => {
      if (typeof loadEvent.target?.result !== 'string') return
      const nextAvatar = loadEvent.target.result
      setAvatarPreview(nextAvatar)
      try {
        window.localStorage.setItem(ADMIN_AVATAR_STORAGE_KEY, nextAvatar)
      } catch {
        message.warning('头像已更新，但未能写入本地缓存')
      }
      message.success('头像已更新')
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  const onLogout = () => {
    storage.clearToken()
    logout()
    navigate('/login', { replace: true })
  }

  const me = asRecord(meQuery.data?.data)
  const adminNickname = asString(me.nickname || me.name, asString(profile?.nickname, '王学长'))

  const cardRows: Array<{ section: string; items: SettingsRow[] }> = [
    {
      section: '隐私与安全',
      items: [
        {
          title: '权限说明',
          desc: '当前账号：超级管理员权限',
          icon: <SafetyCertificateOutlined />,
          iconClassName: 'bg-[#e8f5e9] text-[#4caf50]',
        },
      ],
    },
    {
      section: '系统信息',
      items: [
        {
          title: '关于 SDU Meow',
          desc: '当前版本 v2.4 (Build 20250121)',
          icon: <InfoCircleOutlined />,
          iconClassName: 'bg-[#f1f5f9] text-[#475569]',
          rightNode: (
            <span className="rounded-md bg-[#f1f5f9] px-2 py-1 text-[10px] font-semibold text-[#64748b]">最新</span>
          ),
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-8">
      <section className="mb-6 rounded-b-[40px] bg-gradient-to-br from-[#fff8e1] to-white px-5 pb-8 pt-8 text-center shadow-[0_10px_30px_rgba(0,0,0,0.05)]">
        <div className="relative mx-auto mb-4 h-[100px] w-[100px]">
          {avatarPreview ? (
            <img
              alt="管理员头像"
              className="h-full w-full rounded-full border-4 border-white object-cover shadow-[0_8px_20px_rgba(0,0,0,0.1)]"
              referrerPolicy="no-referrer"
              src={avatarPreview}
            />
          ) : (
            <div className="h-full w-full rounded-full border-4 border-white bg-gradient-to-br from-[#d1d5db] to-[#94a3b8] shadow-[0_8px_20px_rgba(0,0,0,0.1)]" />
          )}
          <label
            className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border-2 border-white bg-[#66bb6a] text-white"
            htmlFor={avatarInputId}
          >
            <CameraOutlined />
          </label>
          <input accept="image/*" className="hidden" id={avatarInputId} onChange={onAvatarChange} type="file" />
        </div>

        <h1 className="mb-1 text-[20px] font-extrabold text-[#2c3e50]">{adminNickname}</h1>
        <span className="inline-flex items-center gap-1 rounded-full bg-black/5 px-3 py-1 text-[13px] text-[#7f8c8d]">
          <CrownFilled className="text-[#facc15]" />
          超级管理员
        </span>

        <div className="mt-6 flex items-center justify-center gap-6">
          <div className="text-center">
            <p className="text-[18px] font-bold text-[#2c3e50]">124</p>
            <p className="text-[11px] text-[#7f8c8d]">处理 SOS</p>
          </div>
          <div className="h-8 w-px bg-[#eee]" />
          <div className="text-center">
            <p className="text-[18px] font-bold text-[#2c3e50]">56</p>
            <p className="text-[11px] text-[#7f8c8d]">领养成功</p>
          </div>
          <div className="h-8 w-px bg-[#eee]" />
          <div className="text-center">
            <p className="text-[18px] font-bold text-[#2c3e50]">18</p>
            <p className="text-[11px] text-[#7f8c8d]">发布公告</p>
          </div>
        </div>
      </section>

      <div className="h5-content pt-0">
        {cardRows.map((group) => (
          <section key={group.section} className="mb-5">
            <h2 className="mb-3 pl-2 text-[13px] font-bold uppercase tracking-[1px] text-[#7f8c8d]">{group.section}</h2>
            <div className="overflow-hidden rounded-[24px] border border-black/[0.03] bg-white shadow-[0_4px_15px_rgba(0,0,0,0.02)]">
              {group.items.map((item, index) => (
                <button
                  key={item.title}
                  className={clsx(
                    'flex w-full items-center gap-3 px-5 py-4 text-left transition-colors active:bg-[#f8fafc]',
                    index !== group.items.length - 1 && 'border-b border-[#f8fafc]',
                  )}
                  onClick={item.onClick}
                  type="button"
                >
                  <span
                    className={clsx(
                      'flex h-9 w-9 items-center justify-center rounded-[10px] text-[16px]',
                      item.iconClassName,
                    )}
                  >
                    {item.icon}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-[#2c3e50]">{item.title}</span>
                    <span className="block truncate text-[12px] text-[#7f8c8d]">{item.desc}</span>
                  </span>

                  {item.rightNode ?? <RightOutlined className="text-[12px] text-[#cbd5e1]" />}
                </button>
              ))}
            </div>
          </section>
        ))}

        <button
          className="mb-4 flex h-[54px] w-full items-center justify-center gap-2 rounded-[18px] bg-[#fff1f2] text-[15px] font-bold text-[#e11d48] transition-transform active:scale-[0.98]"
          onClick={onLogout}
          type="button"
        >
          <LogoutOutlined />
          退出登录
        </button>
      </div>
    </div>
  )
}
