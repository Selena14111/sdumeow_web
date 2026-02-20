import { Outlet } from 'react-router-dom'

export function AppRootLayout() {
  return (
    <div className="min-h-screen bg-[#e0e5ec]">
      <Outlet />
    </div>
  )
}
