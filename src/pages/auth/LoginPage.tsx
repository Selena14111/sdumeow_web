import { ArrowRightOutlined } from '@ant-design/icons'
import { Button, Modal } from 'antd'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { buildAuthAdminLoginUrl, buildAuthLoginUrl } from '@/api/endpoints/auth'
import logo from '@/assets/猫猫图鉴-logo.png'
import { useAuth } from '@/hooks/useAuth'
import { usePageTitle } from '@/hooks/usePageTitle'
import { STORAGE_KEYS } from '@/utils/constants'
import { storage } from '@/utils/storage'

function shouldBridgeToLocalhost(): boolean {
  return ['127.0.0.1', '0.0.0.0'].includes(window.location.hostname)
}

function buildLocalhostLoginUrl(mode: 'user' | 'admin'): string {
  const url = new URL(window.location.href)
  url.hostname = 'localhost'
  url.pathname = '/login'
  url.search = ''
  url.searchParams.set('auth_mode', mode)
  return url.toString()
}

export function LoginPage() {
  usePageTitle('登录')
  const navigate = useNavigate()
  const location = useLocation()
  const { enterGuest } = useAuth()
  const hasShownLoginNoticeRef = useRef(false)
  const [redirecting, setRedirecting] = useState<'user' | 'admin' | null>(null)
  const [loginNotice, setLoginNotice] = useState('')
  const loginUrl = useMemo(() => buildAuthLoginUrl({ platform: 'mobile' }), [])
  const adminLoginUrl = useMemo(() => buildAuthAdminLoginUrl({ platform: 'mobile' }), [])

  const handleSduLogin = useCallback((mode: 'user' | 'admin') => {
    setRedirecting(mode)

    if (shouldBridgeToLocalhost()) {
      window.location.assign(buildLocalhostLoginUrl(mode))
      return
    }

    sessionStorage.setItem(STORAGE_KEYS.authLoginMode, mode)
    localStorage.setItem(STORAGE_KEYS.authLoginMode, mode)
    if (mode === 'user') {
      window.location.assign(loginUrl)
      return
    }
    window.location.assign(adminLoginUrl)
  }, [adminLoginUrl, loginUrl])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const mode = params.get('auth_mode')
    if (mode !== 'user' && mode !== 'admin') return

    params.delete('auth_mode')
    const cleanSearch = params.toString()
    window.history.replaceState(null, '', `${window.location.pathname}${cleanSearch ? `?${cleanSearch}` : ''}${window.location.hash}`)
    handleSduLogin(mode)
  }, [handleSduLogin])

  useEffect(() => {
    if (hasShownLoginNoticeRef.current) return

    const state = typeof location.state === 'object' && location.state !== null ? location.state as { loginNotice?: unknown } : {}
    const stateNotice = typeof state.loginNotice === 'string' ? state.loginNotice : ''
    const storedNotice = window.sessionStorage.getItem(STORAGE_KEYS.authLoginNotice) ?? ''
    const notice = stateNotice || storedNotice
    if (!notice) return

    hasShownLoginNoticeRef.current = true
    window.sessionStorage.removeItem(STORAGE_KEYS.authLoginNotice)
    setLoginNotice(notice)
  }, [location.state])

  const handleLoginNoticeClose = () => {
    setLoginNotice('')
    navigate('/login', { replace: true, state: null })
  }

  const handleGuest = () => {
    storage.clearToken()
    enterGuest()
    navigate('/user/home', { replace: true })
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[390px] flex-col items-center bg-white px-6 pb-10 pt-24">
      <div className="mb-7">
        <img alt="SDU Meow logo" className="h-28 w-auto object-contain" src={logo} />
      </div>
      <h1 className="text-[26px] font-bold text-[#1a1a1a]">Hello, 校友</h1>
      <p className="mt-2 text-[14px] text-[#9e9e9e]">欢迎回到山大猫猫图鉴</p>

      <div className="mt-9 w-full rounded-[24px] bg-white px-5 py-6 shadow-[0_10px_24px_rgba(0,0,0,0.08)]">
        <Button
          block
          className="dark-pill-btn !h-[50px] !text-[16px]"
          icon={<ArrowRightOutlined />}
          iconPosition="end"
          loading={redirecting === 'user'}
          type="primary"
          onClick={() => handleSduLogin('user')}
        >
          {redirecting ? '正在前往统一认证' : '山东大学统一认证登录'}
        </Button>
        <Button
          block
          className="!mt-3 !h-[46px] !text-[15px]"
          icon={<ArrowRightOutlined />}
          iconPosition="end"
          loading={redirecting === 'admin'}
          onClick={() => handleSduLogin('admin')}
        >
          &#31649;&#29702;&#21592;&#30331;&#24405;
        </Button>
        <p className="mt-4 text-center text-[12px] text-[#c7c7c7]">SDU Meow V2.3</p>
      </div>

      <button className="mt-7 text-[12px] text-[#9e9e9e]" type="button" onClick={handleGuest}>
        游客访问
      </button>
      <Modal
        centered
        cancelButtonProps={{ style: { display: 'none' } }}
        okText="知道了"
        open={Boolean(loginNotice)}
        title={loginNotice || '请登录使用功能'}
        onCancel={handleLoginNoticeClose}
        onOk={handleLoginNoticeClose}
      >
        <p>登录后即可继续使用该功能。</p>
      </Modal>
    </div>
  )
}
