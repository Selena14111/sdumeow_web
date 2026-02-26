import {
  CameraOutlined,
  CloseOutlined,
  EnvironmentOutlined,
  PlusCircleOutlined,
  RightOutlined,
  SendOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button, Form, Input, Select, message } from 'antd'
import clsx from 'clsx'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { ApiNotFoundError } from '@/api/adapters/errors'
import { getCats } from '@/api/endpoints/cats'
import { publishMoment } from '@/api/endpoints/moments'
import { ApiUnavailable } from '@/components/feedback/ApiUnavailable'
import { usePageTitle } from '@/hooks/usePageTitle'

type PublishForm = {
  content: string
  relatedCatIds: string
  location?: string
  mediaText?: string
}

const mediaActions = [
  { key: 'camera', label: '拍一张', icon: <CameraOutlined />, active: true },
  { key: 'album', label: '相册', icon: <CameraOutlined />, active: false },
  { key: 'video', label: '视频', icon: <VideoCameraOutlined />, active: false },
]

function parseMedia(mediaText?: string): string[] {
  if (!mediaText) {
    return []
  }

  return mediaText
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
}

export function PublishPageLegacy() {
  usePageTitle('分享趣事')
  const navigate = useNavigate()
  const [form] = Form.useForm<PublishForm>()

  const mutation = useMutation({
    mutationFn: (values: PublishForm) => publishMoment(values),
    onSuccess: () => message.success('发布成功，等待审核'),
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
        <Form form={form} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
          <Form.Item className="!mb-3 border-b border-[#f0f0f0] pb-2" name="title">
            <Input
              className="!border-none !px-0 !text-[18px] !font-bold !text-[#333]"
              placeholder="加个有趣的标题..."
              variant="borderless"
            />
          </Form.Item>
          <Form.Item className="!mb-4" name="content" rules={[{ required: true, message: '请输入分享内容' }]}>
            <Input.TextArea
              autoSize={{ minRows: 4, maxRows: 6 }}
              className="!border-none !px-0 !text-[15px] !leading-7 !text-[#666]"
              placeholder="分享这只猫咪的可爱瞬间..."
              variant="borderless"
            />
          </Form.Item>

          <div className="grid grid-cols-3 gap-2.5">
            {mediaActions.map((action) => (
              <button
                key={action.key}
                className={clsx(
                  'aspect-square rounded-xl border border-dashed text-center text-[#999] transition',
                  action.active
                    ? 'border-[#ffd54f] bg-[#fffde7] text-[#f3a203]'
                    : 'border-[#ddd] bg-[#f8f9fa]',
                )}
                type="button"
              >
                <span className="mb-1 mt-4 block text-[20px]">{action.icon}</span>
                <span className="text-[11px] font-medium">{action.label}</span>
              </button>
            ))}
          </div>

          <div className="mt-5 overflow-hidden rounded-[20px] bg-white shadow-[0_6px_14px_rgba(0,0,0,0.05)]">
            <button className="flex w-full items-center px-4 py-4 text-left" type="button">
              <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#fff3e0] text-[#ef6c00]">
                🐱
              </div>
              <span className="flex-1 text-[14px] font-semibold text-[#333]">关联猫咪</span>
              <span className="mr-2 text-[12px] text-[#999]">选择主角</span>
              <RightOutlined className="text-[#ddd]" />
            </button>
            <div className="h-px bg-[#f9f9f9]" />
            <button className="flex w-full items-center px-4 py-4 text-left" type="button">
              <div className="mr-3 flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#e0f2f1] text-[#009688]">
                <EnvironmentOutlined />
              </div>
              <span className="flex-1 text-[14px] font-semibold text-[#333]">所在位置</span>
              <span className="mr-2 text-[12px] text-[#999]">济南中心校区</span>
              <RightOutlined className="text-[#ddd]" />
            </button>
          </div>

          <button
            className="mt-4 flex h-[46px] w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#ffd54f] text-[13px] font-semibold text-[#fbc02d]"
            type="button"
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
            type="primary"
          >
            立即发布
          </Button>
        </Form>
      </div>

      <p className="text-center text-[11px] text-[#c0c0c0]">内容将由管理员审核后公开展示</p>

      {mutation.error instanceof ApiNotFoundError ? (
        <div className="mt-4">
          <ApiUnavailable title="动态发布接口暂不可用" />
        </div>
      ) : null}
    </div>
  )
}

export function PublishPage() {
  usePageTitle('分享趣事')
  const navigate = useNavigate()
  const [form] = Form.useForm<PublishForm>()

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
    if (!selectedCatId && catOptions.length > 0) {
      form.setFieldValue('relatedCatIds', catOptions[0].value)
    }
  }, [catOptions, form])

  const mutation = useMutation({
    mutationFn: (values: PublishForm) => {
      const media = parseMedia(values.mediaText)

      return publishMoment({
        content: values.content.trim(),
        relatedCatIds: values.relatedCatIds,
        location: values.location?.trim() || undefined,
        media: media.length > 0 ? media : undefined,
      })
    },
    onSuccess: () => {
      message.success('发布成功，等待审核')
      form.resetFields(['content', 'location', 'mediaText'])
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
          initialValues={{ content: '', relatedCatIds: '', location: '', mediaText: '' }}
          layout="vertical"
          onFinish={(values) => mutation.mutate(values)}
        >
          <Form.Item className="!mb-4" name="content" rules={[{ required: true, message: '请输入分享内容' }]}>
            <Input.TextArea
              autoSize={{ minRows: 4, maxRows: 6 }}
              className="!border-none !px-0 !text-[15px] !leading-7 !text-[#666]"
              placeholder="分享这只猫咪的可爱瞬间..."
              variant="borderless"
            />
          </Form.Item>

          <div className="grid grid-cols-3 gap-2.5">
            {mediaActions.map((action) => (
              <button
                key={action.key}
                className={clsx(
                  'aspect-square rounded-xl border border-dashed text-center text-[#999] transition',
                  action.active ? 'border-[#ffd54f] bg-[#fffde7] text-[#f3a203]' : 'border-[#ddd] bg-[#f8f9fa]',
                )}
                type="button"
              >
                <span className="mb-1 mt-4 block text-[20px]">{action.icon}</span>
                <span className="text-[11px] font-medium">{action.label}</span>
              </button>
            ))}
          </div>

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

          <Form.Item className="!mb-2" label="媒体链接（可选）" name="mediaText">
            <Input.TextArea autoSize={{ minRows: 2, maxRows: 4 }} placeholder="每行一个图片/视频 URL，或用逗号分隔" />
          </Form.Item>

          <button
            className="mt-4 flex h-[46px] w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-[#ffd54f] text-[13px] font-semibold text-[#fbc02d]"
            type="button"
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

      {mutation.error instanceof ApiNotFoundError ? (
        <div className="mt-4">
          <ApiUnavailable title="动态发布接口暂不可用" />
        </div>
      ) : null}
    </div>
  )
}
