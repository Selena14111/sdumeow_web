import { ArrowLeftOutlined, CameraOutlined, CheckOutlined } from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import { Button, Form, Input, message } from 'antd'
import { useNavigate } from 'react-router-dom'

import { ApiNotFoundError } from '@/api/adapters/errors'
import { createNewCat } from '@/api/endpoints/cats'
import { ApiUnavailable } from '@/components/feedback/ApiUnavailable'
import { usePageTitle } from '@/hooks/usePageTitle'

const colorItems = [
  { name: '橘猫', style: 'bg-[#ffcc80]' },
  { name: '三花', style: 'bg-[linear-gradient(135deg,#333_30%,#ffcc80_30%,#ffcc80_70%,#fff_70%)]' },
  { name: '奶牛', style: 'bg-[linear-gradient(135deg,#333_50%,#fff_50%)]' },
  { name: '狸花', style: 'bg-[repeating-linear-gradient(45deg,#9e9e9e,#9e9e9e_5px,#e0e0e0_5px,#e0e0e0_10px)]' },
  { name: '纯白', style: 'bg-white border border-[#eee]' },
  { name: '纯黑', style: 'bg-[#333]' },
  { name: '玳瑁', style: 'bg-[radial-gradient(circle,#ffcc80_20%,#333_80%)]' },
  { name: '蓝猫/灰', style: 'bg-[#bdbdbd]' },
]

const personalities = ['亲人', '怕人', '给撸', '凶猛/哈气', '贪吃', '受伤', '剪耳（绝育）']

type NewCatForm = {
  tempName?: string
  color: string
  campus: string
  location: string
  traits?: string[]
}

export function NewCatPage() {
  usePageTitle('新猫建档')
  const navigate = useNavigate()
  const [form] = Form.useForm<NewCatForm>()
  const currentColor = Form.useWatch('color', form)
  const selectedTraits = Form.useWatch('traits', form) ?? []

  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => createNewCat(payload),
    onSuccess: () => message.success('已提交档案审核'),
    onError: (error) => message.error(error instanceof Error ? error.message : '提交失败'),
  })

  return (
    <div className="h5-content pb-5">
      <div className="mb-4 flex items-center justify-between">
        <button className="top-icon-btn !h-8 !w-8" type="button" onClick={() => navigate(-1)}>
          <ArrowLeftOutlined />
        </button>
        <h1 className="text-[16px] font-extrabold">新猫建档</h1>
        <span className="w-8" />
      </div>

      <div className="mb-4 flex flex-col items-center">
        <button
          className="flex h-[140px] w-[140px] flex-col items-center justify-center rounded-full border-2 border-dashed border-[#ddd] bg-[#f5f5f5] text-[#aaa]"
          type="button"
        >
          <CameraOutlined className="mb-1 text-[30px] text-[#ffd54f]" />
          <span className="text-[12px] font-semibold">上传大头照</span>
          <span className="mt-1 text-[10px]">清晰正面为佳</span>
        </button>
        <p className="mt-3 text-[12px] text-[#999]">照片将用于 AI 识别和档案封面，请认真拍摄</p>
      </div>

      <Form
        form={form}
        initialValues={{ campus: '中心校区', traits: [] }}
        layout="vertical"
        onFinish={(values) => mutation.mutate(values)}
      >
        <div className="mb-4 rounded-[20px] bg-white p-4 shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
          <Form.Item className="!mb-4" label="拟定花名（选填）" name="tempName">
            <Input className="!h-11 !rounded-xl !border-[#eee] !bg-[#fafafa]" placeholder="例如：小黑、大橘（最终由投票决定）" />
          </Form.Item>

          <Form.Item className="!mb-1" label="毛色分类 *" name="color" rules={[{ required: true, message: '请选择毛色' }]}>
            <div className="grid grid-cols-4 gap-3">
              {colorItems.map((item) => (
                <button key={item.name} className="text-center" type="button" onClick={() => form.setFieldValue('color', item.name)}>
                  <span
                    className={`relative mx-auto mb-1 block h-11 w-11 rounded-full border-2 border-transparent shadow-sm ${
                      currentColor === item.name ? 'scale-105 border-[#ffd54f]' : ''
                    } ${item.style}`}
                  />
                  <span className="text-[11px] text-[#666]">{item.name}</span>
                </button>
              ))}
            </div>
          </Form.Item>
        </div>

        <div className="mb-4 rounded-[20px] bg-white p-4 shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
          <div className="mb-3 grid grid-cols-2 gap-2">
            <Form.Item className="!mb-0" label="发现校区 *" name="campus" rules={[{ required: true, message: '请输入校区' }]}>
              <Input className="!h-11 !rounded-xl !border-[#eee] !bg-[#fafafa]" />
            </Form.Item>
            <Form.Item className="!mb-0" label="详细位置 *" name="location" rules={[{ required: true, message: '请输入位置' }]}>
              <Input className="!h-11 !rounded-xl !border-[#eee] !bg-[#fafafa]" placeholder="如：食堂北门草丛" />
            </Form.Item>
          </div>

          <Form.Item className="!mb-0" label="初见性格" name="traits">
            <div className="flex flex-wrap gap-2">
              {personalities.map((tag) => {
                const checked = selectedTraits.includes(tag)
                return (
                  <button
                    key={tag}
                    className={`rounded-full border px-3 py-1.5 text-[12px] transition ${
                      checked
                        ? 'border-[#ffd54f] bg-[#fff8e1] font-semibold text-[#f57f17]'
                        : 'border-transparent bg-[#f5f5f5] text-[#666]'
                    }`}
                    type="button"
                    onClick={() => {
                      const current = new Set(selectedTraits)
                      if (current.has(tag)) {
                        current.delete(tag)
                      } else {
                        current.add(tag)
                      }
                      form.setFieldValue('traits', Array.from(current))
                    }}
                  >
                    {tag}
                  </button>
                )
              })}
            </div>
          </Form.Item>
        </div>

        <Button
          block
          className="primary-pill-btn !h-[50px]"
          htmlType="submit"
          icon={<CheckOutlined />}
          loading={mutation.isPending}
          type="primary"
        >
          提交档案审核
        </Button>
      </Form>

      <p className="mt-3 text-center text-[11px] text-[#c0c0c0]">感谢您为山大流浪猫数据库做出的贡献 ❤️</p>

      {mutation.error instanceof ApiNotFoundError ? (
        <div className="mt-4">
          <ApiUnavailable title="新猫提交接口暂不可用" />
        </div>
      ) : null}
    </div>
  )
}
