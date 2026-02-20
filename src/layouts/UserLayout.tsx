import { HomeFilled, PlusSquareFilled, UserOutlined } from '@ant-design/icons'
import { Outlet } from 'react-router-dom'

import { BottomNav } from '@/components/navigation/BottomNav'

const navItems = [
  { key: 'home', label: '首页', to: '/user/home', icon: <HomeFilled /> },
  { key: 'publish', label: '发布', to: '/user/publish', icon: <PlusSquareFilled /> },
  { key: 'me', label: '我的', to: '/user/me', icon: <UserOutlined /> },
]

export function UserLayout() {
  return (
    <div className="h5-shell">
      <Outlet />
      <BottomNav items={navItems} />
    </div>
  )
}
