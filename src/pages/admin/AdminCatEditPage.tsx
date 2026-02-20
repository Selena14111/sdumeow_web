import { ArrowLeftOutlined, CameraOutlined } from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import { Button, Form, Input, Select, message } from 'antd'
import clsx from 'clsx'
import { useNavigate, useParams } from 'react-router-dom'

import { ApiNotFoundError } from '@/api/adapters/errors'
import { upsertAdminCat } from '@/api/endpoints/admin'
import { ApiUnavailable } from '@/components/feedback/ApiUnavailable'
import { usePageTitle } from '@/hooks/usePageTitle'

type CatEditForm = {
  name: string
  color: string
  gender: string
  location: string
  status: string
  neuteredType: string
  neuteredDate: string
  description: string
  tags: string[]
  healthScore: number
  affinityScore: number
}

const statusOptions = [
  { value: 'SCHOOL', label: '在校生活', icon: '🏫', activeClass: 'bg-[#e8f5e9] border-[#66bb6a] text-[#2e7d32]' },
  { value: 'PENDING_ADOPT', label: '待领养', icon: '🏠', activeClass: 'bg-[#ffebee] border-[#ff5252] text-[#d32f2f]' },
  { value: 'GRADUATED', label: '已毕业', icon: '🎓', activeClass: 'bg-[#e3f2fd] border-[#42a5f5] text-[#1565c0]' },
  { value: 'STAR', label: '喵星明星', icon: '⭐', activeClass: 'bg-[#fff8e1] border-[#ffd54f] text-[#ffa000]' },
]

const tagOptions = ['亲人', '吃货', '话痨', '高冷', '霸主', '学霸', '安静', '粘人', '胆小']

export function AdminCatEditPage() {
  usePageTitle('编辑猫咪档案')
  const navigate = useNavigate()
  const { id = '1' } = useParams()
  const [form] = Form.useForm<CatEditForm>()

  const currentStatus = Form.useWatch('status', form)
  const selectedTags = Form.useWatch('tags', form) ?? []
  const healthScore = Form.useWatch('healthScore', form) ?? 85
  const affinityScore = Form.useWatch('affinityScore', form) ?? 70

  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => upsertAdminCat(payload, id),
    onSuccess: () => {
      message.success('档案已保存')
      navigate('/admin/cats', { replace: true })
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '保存失败，请稍后重试'),
  })

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-36">
      <section className="mb-5 rounded-b-[24px] bg-white px-5 pb-5 pt-5 shadow-[0_2px_15px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="top-icon-btn !rounded-xl !bg-[#f5f5f5]" onClick={() => navigate(-1)} type="button">
              <ArrowLeftOutlined />
            </button>
            <h1 className="text-[20px] font-bold text-[#2c3e50]">编辑猫咪档案</h1>
          </div>
          <button className="text-[14px] text-[#7f8c8d]" type="button">
            删除
          </button>
        </div>
      </section>

      <div className="h5-content pt-0">
        <div className="mb-4 rounded-[20px] bg-white p-5 text-center shadow-[0_4px_15px_rgba(0,0,0,0.03)]">
          <button
            className="mx-auto flex h-[120px] w-[120px] items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-black/10 bg-[#f5f5f5]"
            type="button"
          >
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#d1d5db] to-[#94a3b8] text-white/85">
              <CameraOutlined className="text-[26px]" />
            </div>
          </button>
          <p className="mt-2 text-[12px] text-[#7f8c8d]">点击图片更换头像</p>
        </div>

        <Form
          form={form}
          initialValues={{
            name: '麻薯',
            color: '三花',
            gender: 'FEMALE',
            location: '软件园校区',
            status: 'SCHOOL',
            neuteredType: 'EAR_CUT',
            neuteredDate: '2023-11-13',
            description: '麻薯非常亲人，喜欢吃罐头。进食时不喜欢被摸头，偶尔会哈气。',
            tags: ['亲人', '吃货'],
            healthScore: 85,
            affinityScore: 70,
          }}
          layout="vertical"
          onFinish={(values) => mutation.mutate(values)}
        >
          <section className="mb-4 rounded-[20px] bg-white p-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)]">
            <p className="mb-4 text-[14px] font-bold uppercase tracking-wide text-[#7f8c8d]">基础信息</p>

            <Form.Item label="猫咪名字" name="name" rules={[{ required: true, message: '请输入猫咪名字' }]}>
              <Input className="!h-11 !rounded-xl !border-none !bg-[#f8f9fa]" />
            </Form.Item>

            <div className="grid grid-cols-2 gap-3">
              <Form.Item label="花色" name="color" rules={[{ required: true, message: '请输入花色' }]}>
                <Input className="!h-11 !rounded-xl !border-none !bg-[#f8f9fa]" />
              </Form.Item>
              <Form.Item label="性别" name="gender" rules={[{ required: true, message: '请选择性别' }]}>
                <Select
                  className="w-full"
                  options={[
                    { label: '母猫', value: 'FEMALE' },
                    { label: '公猫', value: 'MALE' },
                    { label: '未知', value: 'UNKNOWN' },
                  ]}
                />
              </Form.Item>
            </div>

            <Form.Item label="常驻地点" name="location" rules={[{ required: true, message: '请输入常驻地点' }]}>
              <Input className="!h-11 !rounded-xl !border-none !bg-[#f8f9fa]" />
            </Form.Item>
          </section>

          <section className="mb-4 rounded-[20px] bg-white p-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)]">
            <p className="mb-3 text-[14px] font-bold uppercase tracking-wide text-[#7f8c8d]">状态设置</p>
            <Form.Item className="!mb-0" name="status" rules={[{ required: true, message: '请选择状态' }]}>
              <div className="grid grid-cols-2 gap-2">
                {statusOptions.map((option) => {
                  const active = currentStatus === option.value
                  return (
                    <button
                      key={option.value}
                      className={clsx(
                        'rounded-2xl border-2 border-transparent bg-[#f8f9fa] px-3 py-3 text-center text-[13px] text-[#7f8c8d] transition',
                        active && option.activeClass,
                      )}
                      onClick={() => form.setFieldValue('status', option.value)}
                      type="button"
                    >
                      <span className="mb-1 block text-[18px]">{option.icon}</span>
                      <span className="font-semibold">{option.label}</span>
                    </button>
                  )
                })}
              </div>
            </Form.Item>
          </section>

          <section className="mb-4 rounded-[20px] bg-white p-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)]">
            <p className="mb-3 text-[14px] font-bold uppercase tracking-wide text-[#7f8c8d]">属性评分</p>

            <Form.Item className="!mb-4" label="健康指数" name="healthScore">
              <div>
                <div className="mb-2 flex items-center justify-between text-[13px]">
                  <span className="text-[#7f8c8d]">当前值</span>
                  <span className="font-bold text-[#ffa000]">{healthScore}</span>
                </div>
                <input
                  className="w-full accent-[#ffa726]"
                  max={100}
                  min={0}
                  onChange={(event) => form.setFieldValue('healthScore', Number(event.target.value))}
                  type="range"
                  value={healthScore}
                />
              </div>
            </Form.Item>

            <Form.Item className="!mb-0" label="亲人指数" name="affinityScore">
              <div>
                <div className="mb-2 flex items-center justify-between text-[13px]">
                  <span className="text-[#7f8c8d]">当前值</span>
                  <span className="font-bold text-[#ffa000]">{affinityScore}</span>
                </div>
                <input
                  className="w-full accent-[#ffa726]"
                  max={100}
                  min={0}
                  onChange={(event) => form.setFieldValue('affinityScore', Number(event.target.value))}
                  type="range"
                  value={affinityScore}
                />
              </div>
            </Form.Item>
          </section>

          <section className="mb-4 rounded-[20px] bg-white p-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)]">
            <p className="mb-3 text-[14px] font-bold uppercase tracking-wide text-[#7f8c8d]">标签特征</p>
            <Form.Item className="!mb-0" name="tags">
              <div className="flex flex-wrap gap-2">
                {tagOptions.map((tag) => {
                  const active = selectedTags.includes(tag)
                  return (
                    <button
                      key={tag}
                      className={clsx(
                        'rounded-full border px-3 py-1.5 text-[13px] transition',
                        active
                          ? 'border-transparent bg-[#ffd54f] font-semibold text-[#5d4037] shadow-[0_4px_10px_rgba(255,213,79,0.3)]'
                          : 'border-transparent bg-[#f5f5f5] text-[#7f8c8d]',
                      )}
                      onClick={() => {
                        const next = active ? selectedTags.filter((item) => item !== tag) : [...selectedTags, tag]
                        form.setFieldValue('tags', next)
                      }}
                      type="button"
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>
            </Form.Item>
          </section>

          <section className="mb-4 rounded-[20px] bg-white p-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)]">
            <p className="mb-4 text-[14px] font-bold uppercase tracking-wide text-[#7f8c8d]">其他信息</p>

            <div className="grid grid-cols-2 gap-3">
              <Form.Item label="绝育方式" name="neuteredType">
                <Select
                  options={[
                    { label: '耳尖标记', value: 'EAR_CUT' },
                    { label: '已绝育（无耳标）', value: 'NORMAL' },
                    { label: '未绝育', value: 'NONE' },
                  ]}
                />
              </Form.Item>

              <Form.Item label="绝育日期" name="neuteredDate">
                <Input className="!h-11 !rounded-xl !border-none !bg-[#f8f9fa]" type="date" />
              </Form.Item>
            </div>

            <Form.Item label="备注描述" name="description">
              <Input.TextArea className="!rounded-xl !border-none !bg-[#f8f9fa]" rows={4} />
            </Form.Item>
          </section>
        </Form>

        {mutation.error instanceof ApiNotFoundError ? <ApiUnavailable title="猫咪保存接口暂不可用" /> : null}
      </div>

      <div className="fixed bottom-6 left-1/2 z-30 grid w-[min(350px,calc(100%-34px))] -translate-x-1/2 grid-cols-2 gap-3 rounded-3xl border border-white/40 bg-white/90 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.1)] backdrop-blur-xl">
        <Button
          className="!h-12 !rounded-2xl !border-none !bg-white !text-[14px] !font-bold !text-[#475569]"
          onClick={() => navigate(-1)}
          type="text"
        >
          取消返回
        </Button>
        <Button
          className="!h-12 !rounded-2xl !border-none !text-[14px] !font-bold !text-[#5d4037]"
          loading={mutation.isPending}
          onClick={() => form.submit()}
          style={{
            background: 'linear-gradient(135deg, #FFD54F 0%, #FFCA28 100%)',
            boxShadow: '0 4px 15px rgba(255, 213, 79, 0.4)',
          }}
          type="text"
        >
          保存档案
        </Button>
      </div>
    </div>
  )
}
