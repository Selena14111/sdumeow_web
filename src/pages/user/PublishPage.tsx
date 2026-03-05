import {
  CameraOutlined,
  CloseOutlined,
  DeleteOutlined,
  PictureOutlined,
  PlusCircleOutlined,
  SendOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Form, Input, Select, message } from 'antd'
import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { getCats } from '@/api/endpoints/cats'
import { publishMoment } from '@/api/endpoints/moments'
import { usePageTitle } from '@/hooks/usePageTitle'

type PublishForm = {
  content: string
  relatedCatIds: string
  location?: string
}

type LocalMediaItem = {
  id: string
  file: File
  dataUrl: string
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

export function PublishPage() {
  usePageTitle('分享趣事')
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [form] = Form.useForm<PublishForm>()
  const catIdFromQuery = searchParams.get('catId')?.trim() ?? ''

  const [mediaList, setMediaList] = useState<LocalMediaItem[]>([])
  const albumInputRef = useRef<HTMLInputElement | null>(null)
  const cameraInputRef = useRef<HTMLInputElement | null>(null)

  const catsQuery = useQuery({
    queryKey: ['publish-cats'],
    queryFn: () => getCats({ page: 1, pageSize: 100 }),
  })

  const catOptions = (catsQuery.data?.data?.items ?? []).map((item) => ({
    label: item.name,
    value: item.id,
  }))

  useEffect(() => {
    const selectedCatId = form.getFieldValue('relatedCatIds')
    if (selectedCatId && catOptions.some((item) => item.value === selectedCatId)) {
      return
    }
    if (!catOptions.length) {
      return
    }

    const preferredCatId = catIdFromQuery && catOptions.some((item) => item.value === catIdFromQuery) ? catIdFromQuery : catOptions[0].value
    form.setFieldValue('relatedCatIds', preferredCatId)
  }, [catIdFromQuery, catOptions, form])

  const appendMediaFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    if (!files.length) return

    const nextItems: LocalMediaItem[] = []
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        message.warning('仅支持图片文件')
        continue
      }

      if (file.size > 8 * 1024 * 1024) {
        message.warning('单张图片不能超过 8MB')
        continue
      }

      const dataUrl = await toDataUrl(file)
      nextItems.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        dataUrl,
      })
    }

    if (nextItems.length > 0) {
      setMediaList((current) => [...current, ...nextItems].slice(0, 9))
    }

    event.target.value = ''
  }

  const removeMedia = (id: string) => {
    setMediaList((current) => current.filter((item) => item.id !== id))
  }

  const mutation = useMutation({
    mutationFn: (values: PublishForm) =>
      publishMoment({
        content: values.content.trim(),
        relatedCatIds: values.relatedCatIds,
        location: values.location?.trim() || undefined,
        media: mediaList.length > 0 ? mediaList.map((item) => item.file) : undefined,
      }),
    onSuccess: async (_, values) => {
      message.success('发布成功')
      setMediaList([])
      form.resetFields(['content', 'location'])

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['cat-moments', values.relatedCatIds] }),
        queryClient.invalidateQueries({ queryKey: ['moments'] }),
      ])

      navigate(`/user/cats/${values.relatedCatIds}`)
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '发布失败'),
  })

  return (
    <div className="h5-content pb-6">
      <div className="mb-5 flex items-center justify-between">
        <button className="top-icon-btn !h-8 !w-8 !bg-[#eee]" type="button" onClick={() => navigate(-1)}>
          <CloseOutlined className="text-[14px]" />
        </button>
        <h1 className="text-[16px] font-extrabold text-[#1a1a1a]">分享趣事</h1>
        <span className="w-8" />
      </div>

      <div className="mb-4 rounded-[24px] bg-white p-5 shadow-[0_10px_20px_rgba(0,0,0,0.06)]">
        <Form
          form={form}
          initialValues={{ content: '', relatedCatIds: catIdFromQuery, location: '' }}
          layout="vertical"
          onFinish={(values) => mutation.mutate(values)}
        >
          <Form.Item className="!mb-4" name="content" rules={[{ required: true, message: '请输入动态内容' }]}>
            <Input.TextArea
              autoSize={{ minRows: 4, maxRows: 6 }}
              className="!border-none !px-0 !text-[15px] !leading-7 !text-[#666]"
              placeholder="分享这只猫咪的可爱瞬间..."
              variant="borderless"
            />
          </Form.Item>

          <section className="mb-4 rounded-2xl border border-[#ffe7ab] bg-[#fffdf4] p-3">
            <p className="mb-2 text-[12px] font-semibold text-[#8d6e63]">上传图片（最多 9 张）</p>
            <div className="mb-3 grid grid-cols-2 gap-2">
              <button
                className="flex h-10 items-center justify-center gap-2 rounded-xl bg-white text-[12px] font-semibold text-[#ef6c00]"
                type="button"
                onClick={() => albumInputRef.current?.click()}
              >
                <PictureOutlined />
                从相册选择
              </button>
              <button
                className="flex h-10 items-center justify-center gap-2 rounded-xl bg-white text-[12px] font-semibold text-[#c62828]"
                type="button"
                onClick={() => cameraInputRef.current?.click()}
              >
                <CameraOutlined />
                现场拍摄
              </button>
            </div>

            <input
              ref={albumInputRef}
              accept="image/*"
              className="hidden"
              multiple
              style={{ display: 'none' }}
              type="file"
              onChange={appendMediaFiles}
            />
            <input
              ref={cameraInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              style={{ display: 'none' }}
              type="file"
              onChange={appendMediaFiles}
            />

            {mediaList.length ? (
              <div className="grid grid-cols-3 gap-2">
                {mediaList.map((item) => (
                  <div key={item.id} className="relative h-24 overflow-hidden rounded-lg bg-white">
                    <img alt="动态图片" className="h-full w-full object-cover" src={item.dataUrl} />
                    <button
                      className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/65 text-[10px] text-white"
                      type="button"
                      onClick={() => removeMedia(item.id)}
                    >
                      <DeleteOutlined />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex h-20 items-center justify-center rounded-xl border-2 border-dashed border-[#ffe082] text-[12px] text-[#b08968]">
                未添加图片
              </div>
            )}
          </section>

          <Form.Item className="!mb-3 !mt-4" label="关联猫咪" name="relatedCatIds" rules={[{ required: true, message: '请选择关联猫咪' }]}>
            <Select
              options={catOptions}
              placeholder={catsQuery.isLoading ? '猫咪列表加载中...' : '选择主角猫咪'}
              showSearch
              loading={catsQuery.isLoading}
              disabled={catsQuery.isLoading || catOptions.length === 0}
              optionFilterProp="label"
            />
          </Form.Item>

          <Form.Item className="!mb-3" label="所在位置" name="location">
            <Input placeholder="例如：济南中心校区 · 宿舍楼下" />
          </Form.Item>

          <button
            className="mt-4 flex h-[46px] w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#ffd54f] text-[13px] font-semibold text-[#fbc02d]"
            type="button"
            onClick={() => navigate('/user/new-cat')}
          >
            <PlusCircleOutlined />
            找不到它？为新面孔建立档案
          </button>

          <Button
            block
            className="primary-pill-btn !mt-6 !h-[50px]"
            htmlType="submit"
            icon={<SendOutlined />}
            loading={mutation.isPending}
            disabled={catOptions.length === 0}
            type="primary"
          >
            立即发布
          </Button>
        </Form>
      </div>

      {catsQuery.error ? <p className="mb-3 text-center text-[12px] text-[#d84315]">猫咪列表加载失败，请稍后重试</p> : null}
      <p className="text-center text-[11px] text-[#c0c0c0]">内容将由管理员审核后公开展示</p>
    </div>
  )
}
