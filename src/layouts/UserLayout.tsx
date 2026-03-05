import { HomeFilled, PlusSquareFilled, UserOutlined } from '@ant-design/icons'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import { Outlet } from 'react-router-dom'

import { checkin } from '@/api/endpoints/user'
import { BottomNav } from '@/components/navigation/BottomNav'
import { useAuth } from '@/hooks/useAuth'
import { UserRole } from '@/types/enums'
import { asNumber, asRecord } from '@/utils/format'

const navItems = [
  { key: 'home', label: '首页', to: '/user/home', icon: <HomeFilled /> },
  { key: 'publish', label: '发布', to: '/user/publish', icon: <PlusSquareFilled /> },
  { key: 'me', label: '我的', to: '/user/me', icon: <UserOutlined /> },
]

const AUTO_CHECKIN_TOTAL_DAYS_STORAGE_KEY = 'user:auto-checkin:total-days'

export function UserLayout() {
  const { role, token, hydrated } = useAuth()
  const queryClient = useQueryClient()
  const hasTriggeredRef = useRef(false)

  useEffect(() => {
    if (!hydrated || !token || (role !== UserRole.User && role !== UserRole.Admin)) {
      hasTriggeredRef.current = false
      return
    }
    if (hasTriggeredRef.current) return
    hasTriggeredRef.current = true

    ;(async () => {
      console.log('[auto-checkin] trigger /users/me/checkin', { role })
      try {
        const result = await checkin()
        const checkinData = asRecord(result.data)
        const totalDays = asNumber(checkinData.totalDays, -1)
        if (totalDays >= 0) {
          window.localStorage.setItem(AUTO_CHECKIN_TOTAL_DAYS_STORAGE_KEY, String(Math.floor(totalDays)))
        }
        await queryClient.invalidateQueries({ queryKey: ['me'] })
        console.log('[auto-checkin] success', result?.data)
      } catch (error) {
        console.log('[auto-checkin] failed', error)
      }
    })()
  }, [hydrated, queryClient, role, token])

  return (
    <div className="h5-shell">
      <Outlet />
      <BottomNav items={navItems} />
    </div>
  )
}
