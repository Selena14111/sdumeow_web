import { ArrowRightOutlined } from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import { Button, Form, Input, message } from 'antd'
import { useNavigate } from 'react-router-dom'

import { login as loginApi } from '@/api/endpoints/auth'
import { useAuth } from '@/hooks/useAuth'
import { usePageTitle } from '@/hooks/usePageTitle'
import { UserRole } from '@/types/enums'
import { inferRoleFromAccount } from '@/utils/auth'
import { storage } from '@/utils/storage'

type LoginForm = {
  account: string
  password: string
}

export function LoginPage() {
  usePageTitle('登录')
  const [form] = Form.useForm<LoginForm>()
  const navigate = useNavigate()
  const { login, enterGuest } = useAuth()

  const mutation = useMutation({
    mutationFn: loginApi,
    onSuccess: (_, variables) => {
      const role = inferRoleFromAccount(variables.account)
      const token = `mock-token-${Date.now()}`
      storage.setToken(token)
      login({ token, role, profile: { nickname: variables.account, role } })
      message.success('登录成功')
      navigate(role === UserRole.Admin ? '/admin/home' : '/user/home', { replace: true })
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : '登录失败，请重试')
    },
  })

  const handleGuest = () => {
    storage.clearToken()
    enterGuest()
    navigate('/user/home', { replace: true })
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[390px] flex-col items-center bg-white px-6 pb-10 pt-24">
      <div className="mb-7 flex h-20 w-20 items-center justify-center rounded-[24px] bg-[#ffd54f] text-[38px] shadow-[0_8px_20px_rgba(0,0,0,0.08)]">
        🐾
      </div>
      <h1 className="text-[26px] font-bold text-[#1a1a1a]">Hello, 校友！</h1>
      <p className="mt-2 text-[14px] text-[#9e9e9e]">欢迎回到山大猫猫图鉴</p>

      <div className="mt-9 w-full rounded-[24px] bg-white px-5 py-6 shadow-[0_10px_24px_rgba(0,0,0,0.08)]">
        <Form form={form} initialValues={{ account: '', password: '' }} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
          <Form.Item className="!mb-3" name="account" rules={[{ required: true, message: '请输入学号/工号' }]}>
            <Input
              className="!h-12 !rounded-xl !border-none !bg-[#f5f5f5] !px-4"
              placeholder="学号 / 工号"
            />
          </Form.Item>
          <Form.Item className="!mb-5" name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password
              className="!h-12 !rounded-xl !border-none !bg-[#f5f5f5] !px-4"
              placeholder="密码"
            />
          </Form.Item>
          <Button
            block
            className="dark-pill-btn !h-[50px] !text-[16px]"
            htmlType="submit"
            icon={<ArrowRightOutlined />}
            iconPosition="end"
            loading={mutation.isPending}
            type="primary"
          >
            立即登录
          </Button>
        </Form>
        <p className="mt-4 text-center text-[12px] text-[#c7c7c7]">SDU Meow V2.3</p>
      </div>

      <button className="mt-7 text-[12px] text-[#9e9e9e]" type="button" onClick={handleGuest}>
        游客访问&nbsp;|&nbsp;忘记密码
      </button>
    </div>
  )
}
