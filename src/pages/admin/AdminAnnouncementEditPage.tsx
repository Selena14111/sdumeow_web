import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import { Button, Form, Input, Switch, message } from 'antd'
import clsx from 'clsx'
import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { ApiNotFoundError } from '@/api/adapters/errors'
import { upsertAdminAnnouncement } from '@/api/endpoints/admin'
import { ApiUnavailable } from '@/components/feedback/ApiUnavailable'
import { usePageTitle } from '@/hooks/usePageTitle'

type SaveMode = 'draft' | 'published'

type AnnouncementFormValues = {
  title: string
  content: string
  isPinned: boolean
}

const typeOptions = ['校园公告', '紧急通知', '招募信息', '知识普及', '其他']

export function AdminAnnouncementEditPage() {
  usePageTitle('编辑公告内容')
  const navigate = useNavigate()
  const { id = '1' } = useParams()
  const [form] = Form.useForm<AnnouncementFormValues>()
  const [activeType, setActiveType] = useState(typeOptions[0])

  const mutation = useMutation({
    mutationFn: ({ values, mode }: { values: AnnouncementFormValues; mode: SaveMode }) =>
      upsertAdminAnnouncement(
        {
          ...values,
          type: activeType,
          status: mode,
        },
        id,
      ),
    onSuccess: (_, variables) => {
      message.success(variables.mode === 'draft' ? '草稿已保存' : '公告已发布')
      if (variables.mode === 'published') {
        navigate('/admin/announcements', { replace: true })
      }
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '保存失败，请稍后再试'),
  })

  const submit = async (mode: SaveMode) => {
    try {
      const values = await form.validateFields()
      mutation.mutate({ values, mode })
    } catch {
      message.warning('请先完善必填内容')
    }
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-36">
      <section className="mb-5 rounded-b-[24px] bg-white px-5 pb-5 pt-5 shadow-[0_2px_15px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              className="!h-10 !w-10 !border-none !bg-[#f5f5f5] !text-[#7f8c8d]"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
              shape="circle"
              type="text"
            />
            <h1 className="text-[22px] font-extrabold text-[#2c3e50]">编辑公告内容</h1>
          </div>

          <Button
            className="!h-8 !rounded-lg !border-none !bg-[#f1f5f9] !px-3 !text-xs !font-bold !text-[#475569]"
            icon={<SaveOutlined />}
            loading={mutation.isPending}
            onClick={() => submit('draft')}
            type="text"
          >
            手动保存
          </Button>
        </div>
      </section>

      <div className="h5-content pt-0">
        <Form
          form={form}
          initialValues={{
            title: '关于 2025 年寒假期间校园猫咪管理工作的通知',
            content:
              '各位师生：\n寒假将至，离校在即。为确保校园猫咪在假期期间得到妥善照顾，SDU Meow 协会现将寒假期间管理安排通知如下：\n1. 保留 5 个固定投喂点并安排留校同学轮值。\n2. SOS 求助由值班管理员统一协调处理。\n3. 请离校同学不要在寝室留宿猫咪，避免安全隐患。',
            isPinned: true,
          }}
          layout="vertical"
        >
          <Form.Item
            label={<span className="text-[15px] font-bold text-[#2c3e50]">公告标题</span>}
            name="title"
            rules={[{ required: true, message: '请输入公告标题' }]}
          >
            <Input className="!h-12 !rounded-2xl !border-black/5 !bg-white !px-4" placeholder="请输入标题..." />
          </Form.Item>

          <Form.Item label={<span className="text-[15px] font-bold text-[#2c3e50]">公告分类</span>}>
            <div className="chip-row gap-2 pb-1">
              {typeOptions.map((option) => (
                <button
                  key={option}
                  className={clsx(
                    'rounded-xl border px-4 py-2 text-[14px] font-medium transition-all',
                    activeType === option
                      ? 'border-transparent bg-[#66bb6a] text-white shadow-[0_4px_12px_rgba(102,187,106,0.2)]'
                      : 'border-black/5 bg-white text-[#7f8c8d]',
                  )}
                  onClick={() => setActiveType(option)}
                  type="button"
                >
                  {option}
                </button>
              ))}
            </div>
          </Form.Item>

          <Form.Item
            label={<span className="text-[15px] font-bold text-[#2c3e50]">正文内容</span>}
            name="content"
            rules={[{ required: true, message: '请输入正文内容' }]}
          >
            <Input.TextArea
              className="!rounded-2xl !border-black/5 !bg-white"
              placeholder="请填写详细公告内容..."
              rows={10}
            />
          </Form.Item>

          <div className="mb-4 rounded-2xl border border-black/5 bg-white px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-semibold text-[#2c3e50]">置顶显示</span>
              <Form.Item className="!mb-0" name="isPinned" valuePropName="checked">
                <Switch />
              </Form.Item>
            </div>
          </div>
        </Form>

        {mutation.error instanceof ApiNotFoundError ? (
          <ApiUnavailable title="公告发布接口暂不可用，请稍后重试" />
        ) : null}
      </div>

      <div className="fixed bottom-6 left-1/2 z-30 w-[min(350px,calc(100%-34px))] -translate-x-1/2 rounded-3xl border border-white/40 bg-white/85 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.1)] backdrop-blur-xl">
        <div className="grid grid-cols-2 gap-3">
          <Button
            className="!h-12 !rounded-2xl !border-none !bg-white !text-[14px] !font-bold !text-[#475569]"
            loading={mutation.isPending}
            onClick={() => submit('draft')}
            type="text"
          >
            保存草稿
          </Button>
          <Button
            className="!h-12 !rounded-2xl !border-none !text-[14px] !font-bold !text-white"
            loading={mutation.isPending}
            onClick={() => submit('published')}
            style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)' }}
            type="text"
          >
            立即发布公告
          </Button>
        </div>
      </div>
    </div>
  )
}
