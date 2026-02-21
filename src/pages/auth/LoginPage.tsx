import { ArrowRightOutlined } from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import { Button, Form, Input, Tabs, message, type FormInstance } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import {
  forgotPassword as forgotPasswordApi,
  login as loginApi,
  register as registerApi,
  sendVerificationCode,
} from '@/api/endpoints/auth'
import logo from '@/assets/\u732b\u732b\u56fe\u9274-logo.png'
import { useAuth } from '@/hooks/useAuth'
import { usePageTitle } from '@/hooks/usePageTitle'
import { UserRole } from '@/types/enums'
import { inferRoleFromEmail } from '@/utils/auth'
import { storage } from '@/utils/storage'

type LoginForm = {
  email: string
  password: string
}

type RegisterForm = {
  email: string
  code: string
  password: string
  confirmPassword: string
}

type ForgotPasswordForm = {
  email: string
  code: string
  newPassword: string
  confirmPassword: string
}

type AuthTabKey = 'login' | 'register' | 'forgot-password'

const SDU_MAIL_DOMAIN = 'mail.sdu.edu.cn'

const EMAIL_RULES = [
  { required: true, message: '请输入山东大学邮箱' },
  {
    validator(_: unknown, value?: string) {
      if (!value) {
        return Promise.resolve()
      }

      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
        ? Promise.resolve()
        : Promise.reject(new Error('请输入山东大学邮箱'))
    },
  },
]

function withSduMailDomain(rawValue: string): string {
  const value = rawValue.trim()

  if (/^\d{12}$/.test(value)) {
    return `${value}@${SDU_MAIL_DOMAIN}`
  }

  const atIndex = value.indexOf('@')

  if (atIndex < 0 || value.indexOf('@', atIndex + 1) >= 0) {
    return value
  }

  const localPart = value.slice(0, atIndex)
  if (!localPart) {
    return value
  }

  const domainPart = value.slice(atIndex + 1).toLowerCase()
  if (!domainPart || SDU_MAIL_DOMAIN.startsWith(domainPart)) {
    return `${localPart}@${SDU_MAIL_DOMAIN}`
  }

  return value
}

export function LoginPage() {
  usePageTitle('登录')
  const [loginForm] = Form.useForm<LoginForm>()
  const [registerForm] = Form.useForm<RegisterForm>()
  const [forgotPasswordForm] = Form.useForm<ForgotPasswordForm>()
  const [activeTab, setActiveTab] = useState<AuthTabKey>('login')
  const [registerCodeCountdown, setRegisterCodeCountdown] = useState(0)
  const [forgotCodeCountdown, setForgotCodeCountdown] = useState(0)
  const navigate = useNavigate()
  const { login, enterGuest } = useAuth()

  useEffect(() => {
    if (registerCodeCountdown <= 0) {
      return
    }

    const timer = window.setInterval(() => {
      setRegisterCodeCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer)
          return 0
        }

        return prev - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [registerCodeCountdown])

  useEffect(() => {
    if (forgotCodeCountdown <= 0) {
      return
    }

    const timer = window.setInterval(() => {
      setForgotCodeCountdown((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer)
          return 0
        }

        return prev - 1
      })
    }, 1000)

    return () => window.clearInterval(timer)
  }, [forgotCodeCountdown])

  const loginMutation = useMutation({
    mutationFn: loginApi,
    onSuccess: (result, variables) => {
      const token = result.data?.accessToken?.trim()
      if (!token) {
        message.error('接口未返回 accessToken，登录失败')
        return
      }

      const nextRole = inferRoleFromEmail(variables.email)
      storage.setToken(token)
      login({ token, role: nextRole, profile: { nickname: variables.email, role: nextRole } })
      message.success('登录成功')
      navigate(nextRole === UserRole.Admin ? '/admin/home' : '/user/home', { replace: true })
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : '登录失败，请重试')
    },
  })

  const registerMutation = useMutation({
    mutationFn: registerApi,
    onSuccess: (_, variables) => {
      message.success('注册成功，请登录')
      setActiveTab('login')
      loginForm.setFieldValue('email', variables.email)
      loginForm.setFieldValue('password', '')
      registerForm.resetFields(['code', 'password', 'confirmPassword'])
      setRegisterCodeCountdown(0)
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : '注册失败，请重试')
    },
  })

  const forgotPasswordMutation = useMutation({
    mutationFn: forgotPasswordApi,
    onSuccess: (_, variables) => {
      message.success('密码重置成功，请登录')
      setActiveTab('login')
      loginForm.setFieldValue('email', variables.email)
      loginForm.setFieldValue('password', '')
      forgotPasswordForm.resetFields(['code', 'newPassword', 'confirmPassword'])
      setForgotCodeCountdown(0)
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : '密码重置失败，请重试')
    },
  })

  const sendCodeMutation = useMutation({
    mutationFn: sendVerificationCode,
    onSuccess: () => {
      message.success('验证码已发送，请注意查收')
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : '验证码发送失败，请稍后重试')
    },
  })

  const handleGuest = () => {
    storage.clearToken()
    enterGuest()
    navigate('/user/home', { replace: true })
  }

  const autoCompleteEmailInput = (form: FormInstance, value: string) => {
    const nextValue = withSduMailDomain(value)
    if (nextValue !== value) {
      form.setFieldValue('email', nextValue)
    }
  }

  const handleSendCode = async (form: FormInstance, setCountdown: (countdown: number) => void) => {
    try {
      const { email } = await form.validateFields(['email'])
      sendCodeMutation.mutate(
        { email },
        {
          onSuccess: () => setCountdown(60),
        },
      )
    } catch {
      // validation errors are rendered by antd form
    }
  }

  const tabItems = [
    {
      key: 'login',
      label: '登录',
      children: (
        <Form
          form={loginForm}
          initialValues={{ email: '', password: '' }}
          layout="vertical"
          onFinish={(values) => loginMutation.mutate(values)}
        >
          <Form.Item className="!mb-3" name="email" rules={EMAIL_RULES}>
            <Input
              className="!h-12 !rounded-xl !border-none !bg-[#f5f5f5] !px-4"
              placeholder="请输入山东大学邮箱"
              onChange={(event) => autoCompleteEmailInput(loginForm, event.target.value)}
            />
          </Form.Item>
          <Form.Item className="!mb-5" name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password className="!h-12 !rounded-xl !border-none !bg-[#f5f5f5] !px-4" placeholder="密码" />
          </Form.Item>
          <Button
            block
            className="dark-pill-btn !h-[50px] !text-[16px]"
            htmlType="submit"
            icon={<ArrowRightOutlined />}
            iconPosition="end"
            loading={loginMutation.isPending}
            type="primary"
          >
            登录
          </Button>
        </Form>
      ),
    },
    {
      key: 'register',
      label: '注册',
      children: (
        <Form
          form={registerForm}
          initialValues={{ email: '', code: '', password: '', confirmPassword: '' }}
          layout="vertical"
          onFinish={(values) =>
            registerMutation.mutate({
              email: values.email,
              code: values.code,
              password: values.password,
            })
          }
        >
          <Form.Item className="!mb-3" name="email" rules={EMAIL_RULES}>
            <Input
              className="!h-12 !rounded-xl !border-none !bg-[#f5f5f5] !px-4"
              placeholder="请输入山东大学邮箱"
              onChange={(event) => autoCompleteEmailInput(registerForm, event.target.value)}
            />
          </Form.Item>
          <div className="mb-5 flex items-start gap-2">
            <Form.Item className="!mb-0 flex-1" name="code" rules={[{ required: true, message: '请输入验证码' }]}>
              <Input className="!h-12 !rounded-xl !border-none !bg-[#f5f5f5] !px-4" placeholder="验证码" />
            </Form.Item>
            <Button
              className="!h-12 !rounded-xl"
              disabled={registerCodeCountdown > 0}
              loading={sendCodeMutation.isPending}
              onClick={() => handleSendCode(registerForm, setRegisterCodeCountdown)}
            >
              {registerCodeCountdown > 0 ? `${registerCodeCountdown}s` : '发送验证码'}
            </Button>
          </div>
          <Form.Item className="!mb-3" name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password className="!h-12 !rounded-xl !border-none !bg-[#f5f5f5] !px-4" placeholder="密码" />
          </Form.Item>
          <Form.Item
            className="!mb-5"
            dependencies={['password']}
            name="confirmPassword"
            rules={[
              { required: true, message: '请再次输入密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }

                  return Promise.reject(new Error('两次输入密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password className="!h-12 !rounded-xl !border-none !bg-[#f5f5f5] !px-4" placeholder="确认密码" />
          </Form.Item>
          <Button
            block
            className="dark-pill-btn !h-[50px] !text-[16px]"
            htmlType="submit"
            loading={registerMutation.isPending}
            type="primary"
          >
            注册
          </Button>
        </Form>
      ),
    },
    {
      key: 'forgot-password',
      label: '忘记密码',
      children: (
        <Form
          form={forgotPasswordForm}
          initialValues={{ email: '', code: '', newPassword: '', confirmPassword: '' }}
          layout="vertical"
          onFinish={(values) =>
            forgotPasswordMutation.mutate({
              email: values.email,
              code: values.code,
              newPassword: values.newPassword,
              confirmPassword: values.confirmPassword,
            })
          }
        >
          <Form.Item className="!mb-3" name="email" rules={EMAIL_RULES}>
            <Input
              className="!h-12 !rounded-xl !border-none !bg-[#f5f5f5] !px-4"
              placeholder="请输入山东大学邮箱"
              onChange={(event) => autoCompleteEmailInput(forgotPasswordForm, event.target.value)}
            />
          </Form.Item>
          <div className="mb-5 flex items-start gap-2">
            <Form.Item className="!mb-0 flex-1" name="code" rules={[{ required: true, message: '请输入验证码' }]}>
              <Input className="!h-12 !rounded-xl !border-none !bg-[#f5f5f5] !px-4" placeholder="验证码" />
            </Form.Item>
            <Button
              className="!h-12 !rounded-xl"
              disabled={forgotCodeCountdown > 0}
              loading={sendCodeMutation.isPending}
              onClick={() => handleSendCode(forgotPasswordForm, setForgotCodeCountdown)}
            >
              {forgotCodeCountdown > 0 ? `${forgotCodeCountdown}s` : '发送验证码'}
            </Button>
          </div>
          <Form.Item className="!mb-3" name="newPassword" rules={[{ required: true, message: '请输入新密码' }]}>
            <Input.Password className="!h-12 !rounded-xl !border-none !bg-[#f5f5f5] !px-4" placeholder="新密码" />
          </Form.Item>
          <Form.Item
            className="!mb-5"
            dependencies={['newPassword']}
            name="confirmPassword"
            rules={[
              { required: true, message: '请再次输入新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve()
                  }

                  return Promise.reject(new Error('两次输入密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password className="!h-12 !rounded-xl !border-none !bg-[#f5f5f5] !px-4" placeholder="确认新密码" />
          </Form.Item>
          <Button
            block
            className="dark-pill-btn !h-[50px] !text-[16px]"
            htmlType="submit"
            loading={forgotPasswordMutation.isPending}
            type="primary"
          >
            重置密码
          </Button>
        </Form>
      ),
    },
  ]

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[390px] flex-col items-center bg-white px-6 pb-10 pt-24">
      <div className="mb-7">
        <img alt="SDU Meow logo" className="h-28 w-auto object-contain" src={logo} />
      </div>
      <h1 className="text-[26px] font-bold text-[#1a1a1a]">Hello, 校友</h1>
      <p className="mt-2 text-[14px] text-[#9e9e9e]">欢迎回到山大猫猫图鉴</p>

      <div className="mt-9 w-full rounded-[24px] bg-white px-5 py-6 shadow-[0_10px_24px_rgba(0,0,0,0.08)]">
        <Tabs activeKey={activeTab} destroyInactiveTabPane items={tabItems} onChange={(key) => setActiveTab(key as AuthTabKey)} />
        <p className="mt-4 text-center text-[12px] text-[#c7c7c7]">SDU Meow V2.3</p>
      </div>

      <button className="mt-7 text-[12px] text-[#9e9e9e]" type="button" onClick={handleGuest}>
        游客访问
      </button>
    </div>
  )
}
