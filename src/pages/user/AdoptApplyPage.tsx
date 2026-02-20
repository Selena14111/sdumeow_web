import { ArrowLeftOutlined, InfoCircleFilled } from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import { Button, Checkbox, Form, Input, message } from 'antd'
import clsx from 'clsx'
import { useNavigate } from 'react-router-dom'

import { createAdoption } from '@/api/endpoints/adoptions'
import { usePageTitle } from '@/hooks/usePageTitle'

type AdoptionForm = {
  catId: string
  housing: string
  experience: string
  plan: string
  phone: string
  agree: boolean
}

const housingOptions = [
  { value: 'OWN_HOME', label: '自有住房', icon: '🏠' },
  { value: 'RENT', label: '整租/合租', icon: '🏢' },
  { value: 'DORM', label: '校内宿舍', icon: '🏫' },
  { value: 'WITH_PARENT', label: '与父母同住', icon: '👨‍👩‍👧' },
]

const experienceOptions = [
  { value: 'NEW', label: '新手' },
  { value: 'HAS', label: '有经验' },
  { value: 'MULTI', label: '多猫家庭' },
]

export function AdoptApplyPage() {
  usePageTitle('申请领养')
  const navigate = useNavigate()
  const [form] = Form.useForm<AdoptionForm>()
  const housing = Form.useWatch('housing', form)
  const experience = Form.useWatch('experience', form)

  const mutation = useMutation({
    mutationFn: (payload: AdoptionForm) => createAdoption(payload),
    onSuccess: () => message.success('提交成功，请等待协会审核'),
    onError: (error) => message.error(error instanceof Error ? error.message : '提交失败'),
  })

  return (
    <div className="pb-5">
      <section className="mb-5 rounded-b-[30px] bg-gradient-to-br from-[#fff3e0] to-[#ffe0b2] px-5 pb-5 pt-5">
        <div className="mb-4 flex items-center gap-3">
          <button className="top-icon-btn !bg-white/60 !text-[#5d4037]" type="button" onClick={() => navigate(-1)}>
            <ArrowLeftOutlined />
          </button>
          <h1 className="flex-1 text-center text-[18px] font-bold text-[#5d4037]">申请领养</h1>
          <span className="w-9" />
        </div>
        <div className="grid grid-cols-4 text-center">
          {['填写资料', '协会审核', '线下面谈', '接猫回家'].map((item, index) => (
            <div key={item}>
              <div
                className={clsx(
                  'mx-auto mb-1.5 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold',
                  index === 0 ? 'bg-[#ffd54f] text-[#2c2311]' : 'bg-white/70 text-[#8d7d6b]',
                )}
              >
                {index + 1}
              </div>
              <p className="text-[11px] text-[#8d7d6b]">{item}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="h5-content pt-0">
        <div className="mb-4 flex items-center rounded-[16px] bg-white p-3 shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
          <div className="mr-3 h-14 w-14 rounded-xl bg-gradient-to-br from-[#d1d5db] to-[#94a3b8]" />
          <div className="flex-1">
            <p className="text-[11px] text-[#999]">当前申请对象</p>
            <p className="text-[16px] font-bold text-[#333]">麻薯（三花）</p>
          </div>
          <span className="rounded-full bg-[#e1f5fe] px-2 py-1 text-[10px] font-semibold text-[#0288d1]">已绝育</span>
        </div>

        <div className="mb-5 flex items-start gap-2 rounded-xl bg-[#e3f2fd] px-3 py-2.5 text-[12px] text-[#1565c0]">
          <InfoCircleFilled className="mt-0.5" />
          温馨提示：学生宿舍严禁饲养宠物，请确保您有校外稳定住所。
        </div>

        <Form
          form={form}
          initialValues={{ catId: '1' }}
          layout="vertical"
          onFinish={(values) => mutation.mutate(values as AdoptionForm)}
        >
          <Form.Item hidden name="catId">
            <Input />
          </Form.Item>

          <Form.Item label="目前的居住情况" name="housing" rules={[{ required: true, message: '请选择居住情况' }]}>
            <div className="grid grid-cols-2 gap-2">
              {housingOptions.map((item) => (
                <button
                  key={item.value}
                  className={clsx(
                    'rounded-xl border px-2 py-3 text-center text-[12px] transition',
                    housing === item.value
                      ? 'border-[#ffd54f] bg-[#fff8e1] font-semibold text-[#f57f17]'
                      : 'border-[#eee] bg-white text-[#666]',
                  )}
                  type="button"
                  onClick={() => form.setFieldValue('housing', item.value)}
                >
                  <span className="mb-1 block text-[18px]">{item.icon}</span>
                  {item.label}
                </button>
              ))}
            </div>
          </Form.Item>

          <Form.Item label="养猫经验" name="experience" rules={[{ required: true, message: '请选择养猫经验' }]}>
            <div className="grid grid-cols-3 gap-2">
              {experienceOptions.map((item) => (
                <button
                  key={item.value}
                  className={clsx(
                    'rounded-xl border py-2.5 text-[12px] transition',
                    experience === item.value
                      ? 'border-[#ffd54f] bg-[#fff8e1] font-semibold text-[#f57f17]'
                      : 'border-[#eee] bg-white text-[#666]',
                  )}
                  type="button"
                  onClick={() => form.setFieldValue('experience', item.value)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </Form.Item>

          <Form.Item label="申请理由 & 喂养计划" name="plan" rules={[{ required: true, message: '请填写申请理由' }]}>
            <Input.TextArea
              className="!rounded-xl !bg-[#f9f9f9]"
              placeholder="请简述您的经济状况、封窗计划以及对猫咪不离不弃的承诺..."
              rows={5}
            />
          </Form.Item>

          <Form.Item label="联系方式（微信号/手机号）" name="phone" rules={[{ required: true, message: '请填写联系方式' }]}>
            <Input className="!h-11 !rounded-xl !bg-[#f9f9f9]" placeholder="方便协会负责人联系您" />
          </Form.Item>

          <Form.Item
            className="!mb-5"
            name="agree"
            rules={[{ validator: (_, value) => (value ? Promise.resolve() : Promise.reject(new Error('请先阅读并同意协议'))) }]}
            valuePropName="checked"
          >
            <Checkbox className="text-[12px] text-[#666]">
              我已阅读并同意《山大猫协领养协议》，承诺科学喂养、适龄绝育、有病就医，接受定期回访，绝不遗弃。
            </Checkbox>
          </Form.Item>

          <Button
            block
            className="primary-pill-btn !h-[50px]"
            htmlType="submit"
            loading={mutation.isPending}
            type="primary"
          >
            提交申请
          </Button>
        </Form>
      </div>
    </div>
  )
}
