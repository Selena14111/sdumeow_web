import { AppstoreOutlined, HomeOutlined, HomeTwoTone, TeamOutlined, UserOutlined } from '@ant-design/icons'
import { Outlet, useLocation } from 'react-router-dom'

import { BottomNav } from '@/components/navigation/BottomNav'

const navItems = [
  { key: 'dashboard', label: '工作台', to: '/admin/home', icon: <HomeOutlined /> },
  { key: 'cats', label: '猫咪', to: '/admin/cats', icon: <AppstoreOutlined /> },
  { key: 'adoptions', label: '领养', to: '/admin/adoptions', icon: <HomeTwoTone twoToneColor="#94a3b8" /> },
  { key: 'users', label: '用户', to: '/admin/users', icon: <TeamOutlined /> },
  { key: 'me', label: '我的', to: '/admin/me', icon: <UserOutlined /> },
]

const hiddenNavPatterns = [
  /^\/admin\/cats\/[^/]+\/edit$/,
  /^\/admin\/adoptions\/[^/]+$/,
  /^\/admin\/sos\/[^/]+$/,
  /^\/admin\/announcements\/[^/]+\/edit$/,
  /^\/admin\/articles\/[^/]+\/edit$/,
]

export function AdminLayout() {
  const location = useLocation()
  const hideNav = hiddenNavPatterns.some((pattern) => pattern.test(location.pathname))

  return (
    <div className="h5-shell">
      <Outlet />
      {hideNav ? null : <BottomNav items={navItems} variant="admin" />}
    </div>
  )
}
