import { Button, Card } from 'antd'
import { useNavigate } from 'react-router-dom'

import { useAuth } from '@/hooks/useAuth'
import { usePageTitle } from '@/hooks/usePageTitle'
import { storage } from '@/utils/storage'

export function AdminMePage() {
  usePageTitle('管理员中心')
  const navigate = useNavigate()
  const { logout } = useAuth()

  const onLogout = () => {
    storage.clearToken()
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-[#f3f4f6] px-5 pb-24 pt-4">
      <section className="mb-5 rounded-b-[36px] rounded-t-2xl bg-[#f4f2e6] px-6 pb-8 pt-6 text-center">
        <div className="mx-auto mb-3 h-24 w-24 rounded-full bg-slate-300" />
        <h1 className="text-5xl font-black text-[#2a3342]">PyCmg</h1>
        <span className="mt-2 inline-block rounded-full bg-[#efe8d2] px-3 py-1 text-sm text-[#8b7850]">👑 超级管理员</span>
      </section>

      <h3 className="mb-2 text-xl font-semibold text-[#89929f]">工作台管理</h3>
      <Card className="!mb-4 !overflow-hidden !rounded-3xl !border-none" bodyStyle={{ padding: 0 }}>
        <button className="flex w-full items-center gap-3 border-b border-slate-100 px-5 py-4 text-left" type="button" onClick={() => navigate('/admin/announcements')}>
          <span className="rounded-xl bg-[#dcf2f7] p-2">📣</span>
          <span>
            <b className="block text-[24px]">公告中心</b>
            <span className="text-sm text-[#9aa2b1]">管理校园通知与招募发布</span>
          </span>
        </button>
        <button className="flex w-full items-center gap-3 px-5 py-4 text-left" type="button" onClick={() => navigate('/admin/articles')}>
          <span className="rounded-xl bg-[#f2f2f2] p-2">📰</span>
          <span>
            <b className="block text-[24px]">文章管理</b>
            <span className="text-sm text-[#9aa2b1]">分享养猫知识和猫咪健康护理指南</span>
          </span>
        </button>
      </Card>

      <h3 className="mb-2 text-xl font-semibold text-[#89929f]">隐私与安全</h3>
      <Card className="!mb-5 !overflow-hidden !rounded-3xl !border-none" bodyStyle={{ padding: 0 }}>
        <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
          <span className="rounded-xl bg-[#fff1d8] p-2">🔐</span>
          <span>
            <b className="block text-[24px]">修改密码</b>
            <span className="text-sm text-[#9aa2b1]">建议定期更换以保证安全</span>
          </span>
        </div>
        <div className="flex items-center gap-3 px-5 py-4">
          <span className="rounded-xl bg-[#eaf8e8] p-2">🛡️</span>
          <span>
            <b className="block text-[24px]">权限说明</b>
            <span className="text-sm text-[#9aa2b1]">当前账号：超级管理员权限</span>
          </span>
        </div>
      </Card>

      <Button block className="!mb-6 !h-12 !rounded-full !border-none !bg-[#fdecee] !text-[#ea3048] !text-xl !font-bold" onClick={onLogout}>
        退出登录
      </Button>

      <div className="rounded-full bg-white p-2">
        <div className="ml-auto w-24 rounded-full bg-[#f4cc45] py-2 text-center text-xl font-black">我的</div>
      </div>
    </div>
  )
}
