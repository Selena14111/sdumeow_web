import { ArrowLeftOutlined, CameraOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import { Button, Form, Input, Modal, Select, message } from 'antd'
import { useRef, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { ApiNotFoundError } from '@/api/adapters/errors'
import { createNewCat } from '@/api/endpoints/cats'
import { ApiUnavailable } from '@/components/feedback/ApiUnavailable'
import { usePageTitle } from '@/hooks/usePageTitle'

const colorItems: Array<{ label: string; value: string; style: string }> = [
  { label: '橘猫', value: 'ORANGE', style: 'bg-[#ffcc80]' },
  { label: '狸花', value: 'TABBY', style: 'bg-[repeating-linear-gradient(45deg,#9e9e9e,#9e9e9e_5px,#e0e0e0_5px,#e0e0e0_10px)]' },
  { label: '奶牛', value: 'COW', style: 'bg-[linear-gradient(135deg,#333_50%,#fff_50%)]' },
  { label: '三花', value: 'CALICO', style: 'bg-[linear-gradient(135deg,#333_30%,#ffcc80_30%,#ffcc80_70%,#fff_70%)]' },
  { label: '玳瑁', value: 'TORTOISESHELL', style: 'bg-[radial-gradient(circle,#ffcc80_20%,#333_80%)]' },
  { label: '纯白', value: 'WHITE', style: 'bg-white border border-[#eee]' },
  { label: '纯黑', value: 'BLACK', style: 'bg-[#333]' },
  { label: '其他', value: 'OTHER', style: 'bg-[#bdbdbd]' },
]

const campusOptions: Array<{ label: string; value: number }> = [
  { label: '中心校区', value: 0 },
  { label: '趵突泉校区', value: 1 },
  { label: '洪家楼校区', value: 2 },
  { label: '千佛山校区', value: 3 },
  { label: '兴隆山校区', value: 4 },
  { label: '软件园校区', value: 5 },
  { label: '青岛校区', value: 6 },
  { label: '威海校区', value: 7 },
]

const personalities = ['亲人', '怕人', '给摸', '凶猛/哈气', '贪吃', '受伤', '剪耳（绝育）']

type NewCatForm = {
  tempName?: string
  color: string
  campus: number
  location: string
  traits?: string[]
}

function toDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
        return
      }
      reject(new Error('文件读取失败'))
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

function toNewCatPayload(values: NewCatForm, images: string[]): Record<string, unknown> {
  const tempName = String(values.tempName ?? '').trim()
  const tags = (values.traits ?? []).map((item) => item.trim()).filter(Boolean)

  return {
    tempName: tempName || undefined,
    color: values.color,
    images,
    campus: Number(values.campus),
    location: String(values.location ?? '').trim(),
    tags,
  }
}

export function NewCatPage() {
  usePageTitle('新猫建档')
  const navigate = useNavigate()
  const [form] = Form.useForm<NewCatForm>()
  const albumInputRef = useRef<HTMLInputElement | null>(null)
  const cameraInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [successModalOpen, setSuccessModalOpen] = useState(false)
  const currentColor = Form.useWatch('color', form)
  const selectedTraits = Form.useWatch('traits', form) ?? []

  const mutation = useMutation({
    mutationFn: async (values: NewCatForm) => {
      if (selectedImages.length === 0) {
        throw new Error('请至少上传一张猫咪图片')
      }
      return createNewCat(toNewCatPayload(values, selectedImages))
    },
    onSuccess: () => {
      setSuccessModalOpen(true)
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '提交失败'),
  })

  const handleSuccessModalClose = () => {
    setSuccessModalOpen(false)
    window.location.reload()
  }

  const handlePickCover = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      if (!file.type.startsWith('image/')) {
        message.warning('仅支持图片文件')
        return
      }
      if (file.size > 8 * 1024 * 1024) {
        message.warning('图片不能超过 8MB')
        return
      }

      const dataUrl = await toDataUrl(file)
      setSelectedImages((prev) => {
        if (prev.length >= 3) {
          message.warning('最多上传 3 张图片')
          return prev
        }
        return [...prev, dataUrl]
      })
      message.success('已选择照片')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '图片读取失败')
    } finally {
      event.target.value = ''
    }
  }

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
          onClick={() => albumInputRef.current?.click()}
        >
          {selectedImages[0] ? (
            <img alt="新猫封面预览" className="h-full w-full rounded-full object-cover" src={selectedImages[0]} />
          ) : (
            <>
              <CameraOutlined className="mb-1 text-[30px] text-[#ffd54f]" />
              <span className="text-[12px] font-semibold">上传大头照</span>
              <span className="mt-1 text-[10px]">清晰正面为佳</span>
            </>
          )}
        </button>
        <div className="mt-2 text-[11px] text-[#999]">已添加 {selectedImages.length}/3 张</div>
        <div className="mt-3 grid w-full max-w-[240px] grid-cols-2 gap-2">
          <button
            className="rounded-xl border border-[#eee] bg-white px-3 py-2 text-[12px] font-semibold text-[#555]"
            type="button"
            onClick={() => albumInputRef.current?.click()}
          >
            从相册选择
          </button>
          <button
            className="rounded-xl border border-[#eee] bg-white px-3 py-2 text-[12px] font-semibold text-[#555]"
            type="button"
            onClick={() => cameraInputRef.current?.click()}
          >
            现场拍摄
          </button>
        </div>
        {selectedImages.length > 0 ? (
          <div className="mt-3 flex w-full max-w-[280px] gap-2 overflow-x-auto pb-1">
            {selectedImages.map((item, index) => (
              <div key={`${item}-${index}`} className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[#eee]">
                <img alt={`图片${index + 1}`} className="h-full w-full object-cover" src={item} />
                <button
                  className="absolute right-0 top-0 flex h-4 w-4 items-center justify-center rounded-bl-md bg-black/60 text-[9px] text-white"
                  type="button"
                  onClick={() => setSelectedImages((prev) => prev.filter((_, i) => i !== index))}
                >
                  <CloseOutlined />
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <input ref={albumInputRef} accept="image/*" className="hidden" type="file" onChange={handlePickCover} />
        <input
          ref={cameraInputRef}
          accept="image/*"
          capture="environment"
          className="hidden"
          type="file"
          onChange={handlePickCover}
        />
        <p className="mt-3 text-[12px] text-[#999]">照片将用于档案封面，请认真拍摄</p>
      </div>

      <Form form={form} initialValues={{ campus: 0, traits: [] }} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
        <div className="mb-4 rounded-[20px] bg-white p-4 shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
          <Form.Item className="!mb-4" label="拟定花名" name="tempName">
            <Input className="!h-11 !rounded-xl !border-[#eee] !bg-[#fafafa]" placeholder="例如：小黑、大橘（最终经审核决定）" />
          </Form.Item>

          <Form.Item className="!mb-1" label="毛色分类 *" name="color" rules={[{ required: true, message: '请选择毛色' }]}>
            <div className="grid grid-cols-4 gap-3">
              {colorItems.map((item) => (
                <button
                  key={item.value}
                  className={`rounded-xl px-1 py-1 text-center transition-all duration-200 ${
                    currentColor === item.value
                      ? '-translate-y-0.5 shadow-[0_8px_18px_rgba(251,191,36,0.38)]'
                      : 'hover:shadow-[0_4px_10px_rgba(0,0,0,0.08)]'
                  }`}
                  type="button"
                  onClick={() => form.setFieldValue('color', item.value)}
                >
                  <span
                    className={`relative mx-auto mb-1 block h-11 w-11 rounded-full border-2 border-transparent shadow-sm ${
                      currentColor === item.value ? 'scale-110 border-[#ffd54f] shadow-[0_0_0_4px_rgba(255,213,79,0.28)]' : ''
                    } ${item.style}`}
                  />
                  <span className="text-[11px] text-[#666]">{item.label}</span>
                </button>
              ))}
            </div>
          </Form.Item>
        </div>

        <div className="mb-4 rounded-[20px] bg-white p-4 shadow-[0_8px_20px_rgba(0,0,0,0.06)]">
          <div className="mb-3 grid grid-cols-2 gap-2">
            <Form.Item className="!mb-0" label="发现校区 *" name="campus" rules={[{ required: true, message: '请选择校区' }]}>
              <Select className="!h-11" options={campusOptions} />
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

      <p className="mt-3 text-center text-[11px] text-[#c0c0c0]">感谢您为山大流浪猫数据库做出的贡献</p>

      <Modal
        centered
        cancelButtonProps={{ style: { display: 'none' } }}
        okText="知道了"
        open={successModalOpen}
        title="提交成功"
        onCancel={handleSuccessModalClose}
        onOk={handleSuccessModalClose}
      >
        <p className="mb-0">已成功提交，点击确定后将刷新页面。</p>
      </Modal>

      {mutation.error instanceof ApiNotFoundError ? (
        <div className="mt-4">
          <ApiUnavailable title="新猫提交接口暂不可用" />
        </div>
      ) : null}
    </div>
  )
}