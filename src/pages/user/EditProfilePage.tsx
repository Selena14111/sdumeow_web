import { CameraOutlined, LockOutlined, RightOutlined } from '@ant-design/icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Form, Input, Switch, message } from 'antd'
import { useEffect, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { getMe, updateMe } from '@/api/endpoints/user'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asRecord, asString } from '@/utils/format'

type EditProfileForm = {
  nickname: string
  slogan: string
  campus: string
  studentId: string
  realName: string
  wechat: string
  phone: string
  showBadgeOnProfile: boolean
  pushNotification: boolean
}

type RowProps = {
  label: string
  children: ReactNode
  withArrow?: boolean
}

function FormRow({ label, children, withArrow }: RowProps) {
  return (
    <div className="flex items-center border-b border-[#f9f9f9] py-4 last:border-b-0">
      <span className="w-[88px] text-[14px] font-semibold text-[#333]">{label}</span>
      <div className="min-w-0 flex-1">{children}</div>
      {withArrow ? <RightOutlined className="ml-2 text-[12px] text-[#ddd]" /> : null}
    </div>
  )
}

export function EditProfilePage() {
  usePageTitle('编辑资料')
  const navigate = useNavigate()
  const [form] = Form.useForm<EditProfileForm>()
  const studentId = Form.useWatch('studentId', form)
  const realName = Form.useWatch('realName', form)

  const meQuery = useQuery({
    queryKey: ['me-edit'],
    queryFn: getMe,
  })

  useEffect(() => {
    const profile = asRecord(meQuery.data?.data)
    form.setFieldsValue({
      nickname: asString(profile.nickname, '爱吃鱼的猫'),
      slogan: asString(profile.slogan, '软件园校区第一铲屎官 🐱'),
      campus: asString(profile.campus, '软件园校区'),
      studentId: asString(profile.studentId, '20220012053'),
      realName: asString(profile.realName, '*小明'),
      wechat: asString(profile.wechat),
      phone: asString(profile.phone),
      showBadgeOnProfile: true,
      pushNotification: true,
    })
  }, [form, meQuery.data])

  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => updateMe(payload),
    onSuccess: () => {
      message.success('保存成功')
      navigate('/user/me', { replace: true })
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '保存失败'),
  })

  return (
    <div className="h5-content pb-6">
      <div className="mb-5 flex items-center justify-between">
        <button className="text-[15px] font-semibold text-[#333]" type="button" onClick={() => navigate(-1)}>
          取消
        </button>
        <h1 className="text-[16px] font-bold">编辑资料</h1>
        <button className="text-[15px] font-bold text-[#fbc02d]" type="button" onClick={() => form.submit()}>
          保存
        </button>
      </div>

      <div className="mb-6 flex flex-col items-center">
        <button className="relative h-[100px] w-[100px]" type="button">
          <span className="block h-full w-full rounded-full border-4 border-white bg-gradient-to-br from-[#d1d5db] to-[#94a3b8] shadow-[0_8px_20px_rgba(0,0,0,0.08)]" />
          <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-[3px] border-[#f8f6f4] bg-[#1a1a1a] text-white">
            <CameraOutlined className="text-[12px]" />
          </span>
        </button>
        <p className="mt-2 text-[12px] text-[#999]">点击更换头像</p>
      </div>

      <QueryState error={meQuery.error} isLoading={meQuery.isLoading}>
        <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
          <h3 className="mb-2 ml-2 text-[12px] text-[#999]">基本信息</h3>
          <div className="mb-4 rounded-[20px] bg-white px-4 shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
            <FormRow label="昵称" withArrow>
              <Form.Item noStyle name="nickname" rules={[{ required: true, message: '请输入昵称' }]}>
                <Input className="!h-auto !border-none !bg-transparent !px-0 !text-right !text-[14px] !text-[#666]" variant="borderless" />
              </Form.Item>
            </FormRow>
            <FormRow label="个性签名" withArrow>
              <Form.Item noStyle name="slogan">
                <Input className="!h-auto !border-none !bg-transparent !px-0 !text-right !text-[14px] !text-[#666]" variant="borderless" />
              </Form.Item>
            </FormRow>
            <FormRow label="所属校区" withArrow>
              <Form.Item noStyle name="campus">
                <Input className="!h-auto !border-none !bg-transparent !px-0 !text-right !text-[14px] !text-[#666]" variant="borderless" />
              </Form.Item>
            </FormRow>
          </div>

          <h3 className="mb-2 ml-2 text-[12px] text-[#999]">身份认证</h3>
          <div className="mb-4 rounded-[20px] bg-white px-4 shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
            <FormRow label="学号/工号">
              <div className="flex items-center justify-end gap-1 text-[14px] text-[#ccc]">
                <span>{studentId}</span>
                <LockOutlined className="text-[10px]" />
              </div>
            </FormRow>
            <FormRow label="真实姓名">
              <div className="flex items-center justify-end gap-1 text-[14px] text-[#ccc]">
                <span>{realName}</span>
                <LockOutlined className="text-[10px]" />
              </div>
            </FormRow>
          </div>

          <h3 className="mb-2 ml-2 text-[12px] text-[#999]">联系方式（仅管理员可见）</h3>
          <div className="mb-4 rounded-[20px] bg-white px-4 shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
            <FormRow label="微信号">
              <Form.Item noStyle name="wechat">
                <Input className="!h-auto !border-none !bg-transparent !px-0 !text-right !text-[14px]" placeholder="用于领养沟通" variant="borderless" />
              </Form.Item>
            </FormRow>
            <FormRow label="手机号">
              <Form.Item noStyle name="phone">
                <Input className="!h-auto !border-none !bg-transparent !px-0 !text-right !text-[14px]" placeholder="选填" variant="borderless" />
              </Form.Item>
            </FormRow>
          </div>

          <h3 className="mb-2 ml-2 text-[12px] text-[#999]">偏好设置</h3>
          <div className="rounded-[20px] bg-white px-4 shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
            <FormRow label="主页展示勋章">
              <div className="flex justify-end">
                <Form.Item noStyle name="showBadgeOnProfile" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </div>
            </FormRow>
            <FormRow label="接收投喂通知">
              <div className="flex justify-end">
                <Form.Item noStyle name="pushNotification" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </div>
            </FormRow>
          </div>

          <button className="primary-pill-btn mt-6 w-full" disabled={mutation.isPending} type="submit">
            {mutation.isPending ? '保存中...' : '保存修改'}
          </button>
        </Form>
      </QueryState>
    </div>
  )
}
