import { AppstoreOutlined, HomeOutlined, UserOutlined } from '@ant-design/icons'
import { Outlet } from 'react-router-dom'

import { BottomNav } from '@/components/navigation/BottomNav'

const navItems = [
  { key: 'dashboard', label: '工作台', to: '/admin/home', icon: <HomeOutlined /> },
  { key: 'cats', label: '猫咪', to: '/admin/cats', icon: <AppstoreOutlined /> },
  { key: 'me', label: '我的', to: '/admin/me', icon: <UserOutlined /> },
]

export function AdminLayout() {
  return (
    <div className="h5-shell">
      <Outlet />
      <BottomNav items={navItems} />
    </div>
  )
}
