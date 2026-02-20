import {
  ArrowLeftOutlined,
  BoldOutlined,
  OrderedListOutlined,
  PictureOutlined,
  SaveOutlined,
  UnderlineOutlined,
  UploadOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import { Button, Form, Input, Switch, message } from 'antd'
import clsx from 'clsx'
import { useState } from 'react'
import type { ChangeEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { ApiNotFoundError } from '@/api/adapters/errors'
import { upsertAdminArticle } from '@/api/endpoints/articles'
import { ApiUnavailable } from '@/components/feedback/ApiUnavailable'
import { usePageTitle } from '@/hooks/usePageTitle'

type SaveMode = 'draft' | 'published'

type ArticleFormValues = {
  title: string
  summary: string
  content: string
  featured: boolean
  allowComment: boolean
}

const categoryOptions = ['健康科普', '营养知识', '行为解读', 'TNR 科普', '日常护理', '其他']

export function AdminArticleEditPage() {
  usePageTitle('编辑科普文章')
  const navigate = useNavigate()
  const { id = '1' } = useParams()
  const [form] = Form.useForm<ArticleFormValues>()
  const [activeCategory, setActiveCategory] = useState(categoryOptions[0])
  const [coverPreview, setCoverPreview] = useState<string | null>(null)

  const mutation = useMutation({
    mutationFn: ({ values, mode }: { values: ArticleFormValues; mode: SaveMode }) =>
      upsertAdminArticle(
        {
          ...values,
          category: activeCategory,
          status: mode,
        },
        id,
      ),
    onSuccess: (_, variables) => {
      message.success(variables.mode === 'draft' ? '草稿已保存' : '文章已发布')
      if (variables.mode === 'published') {
        navigate('/admin/articles', { replace: true })
      }
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '保存失败，请稍后重试'),
  })

  const submit = async (mode: SaveMode) => {
    try {
      const values = await form.validateFields()
      mutation.mutate({ values, mode })
    } catch {
      message.warning('请先完善必填内容')
    }
  }

  const onCoverChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (loadEvent) => {
      if (typeof loadEvent.target?.result === 'string') {
        setCoverPreview(loadEvent.target.result)
      }
    }
    reader.readAsDataURL(file)
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
            <h1 className="text-[22px] font-extrabold text-[#2c3e50]">编辑科普文章</h1>
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
            title: '流浪猫常见疾病防治指南',
            summary:
              '流浪猫在野外生活中容易接触到各种疾病，了解常见疾病症状和预防措施，对校园救助工作非常重要。',
            content:
              '# 流浪猫常见疾病防治指南\n\n## 一、猫瘟（FPV）\n猫瘟是由猫细小病毒引起的高度传染性疾病。\n\n## 二、杯状病毒（FCV）\n主要表现为口腔溃疡、流涕、打喷嚏。\n\n## 三、救助建议\n1. 及时就医\n2. 观察记录\n3. 保持隔离',
            featured: true,
            allowComment: true,
          }}
          layout="vertical"
        >
          <Form.Item label={<span className="text-[15px] font-bold text-[#2c3e50]">文章封面</span>}>
            <label
              className="flex h-[180px] cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-[#cbd5e1] bg-gradient-to-br from-[#f1f5f9] to-[#e2e8f0]"
              htmlFor="article-cover-upload"
            >
              {coverPreview ? (
                <img alt="文章封面预览" className="h-full w-full object-cover" src={coverPreview} />
              ) : (
                <>
                  <UploadOutlined className="mb-2 text-[30px] text-[#94a3b8]" />
                  <p className="text-[13px] font-medium text-[#64748b]">点击上传封面图片</p>
                  <p className="mt-1 text-[11px] text-[#94a3b8]">建议尺寸 600 × 300，支持 JPG/PNG</p>
                </>
              )}
            </label>
            <input
              accept="image/*"
              className="hidden"
              id="article-cover-upload"
              onChange={onCoverChange}
              type="file"
            />
          </Form.Item>

          <Form.Item
            label={<span className="text-[15px] font-bold text-[#2c3e50]">文章标题</span>}
            name="title"
            rules={[{ required: true, message: '请输入文章标题' }]}
          >
            <Input className="!h-12 !rounded-2xl !border-black/5 !bg-white !px-4" placeholder="请输入标题..." />
          </Form.Item>

          <Form.Item label={<span className="text-[15px] font-bold text-[#2c3e50]">文章分类</span>}>
            <div className="chip-row gap-2 pb-1">
              {categoryOptions.map((option) => (
                <button
                  key={option}
                  className={clsx(
                    'rounded-xl border px-4 py-2 text-[14px] font-medium transition-all',
                    activeCategory === option
                      ? 'border-transparent bg-[#66bb6a] text-white shadow-[0_4px_12px_rgba(102,187,106,0.2)]'
                      : 'border-black/5 bg-white text-[#7f8c8d]',
                  )}
                  onClick={() => setActiveCategory(option)}
                  type="button"
                >
                  {option}
                </button>
              ))}
            </div>
          </Form.Item>

          <Form.Item label={<span className="text-[15px] font-bold text-[#2c3e50]">文章摘要</span>} name="summary">
            <Input.TextArea
              className="!rounded-2xl !border-black/5 !bg-white"
              placeholder="摘要将展示在文章列表页"
              rows={3}
            />
          </Form.Item>

          <Form.Item
            label={<span className="text-[15px] font-bold text-[#2c3e50]">正文内容</span>}
            name="content"
            rules={[{ required: true, message: '请输入正文内容' }]}
          >
            <div>
              <div className="flex items-center gap-2 rounded-t-xl border border-[#e2e8f0] bg-[#f8fafc] p-2">
                {[BoldOutlined, UnderlineOutlined, OrderedListOutlined, UnorderedListOutlined, PictureOutlined].map(
                  (IconComponent, index) => (
                    <button
                      key={String(index)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#e2e8f0] bg-white text-[#64748b]"
                      onClick={() => message.info('编辑器工具栏在当前版本为展示态')}
                      type="button"
                    >
                      <IconComponent />
                    </button>
                  ),
                )}
              </div>
              <Input.TextArea
                className="!rounded-b-xl !rounded-t-none !border-[#e2e8f0] !bg-white"
                placeholder="请输入文章正文..."
                rows={14}
              />
            </div>
          </Form.Item>

          <div className="mb-4 space-y-3 rounded-2xl border border-black/5 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-semibold text-[#2c3e50]">推荐文章</span>
              <Form.Item className="!mb-0" name="featured" valuePropName="checked">
                <Switch />
              </Form.Item>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-semibold text-[#2c3e50]">允许评论</span>
              <Form.Item className="!mb-0" name="allowComment" valuePropName="checked">
                <Switch />
              </Form.Item>
            </div>
          </div>
        </Form>

        {mutation.error instanceof ApiNotFoundError ? (
          <ApiUnavailable title="文章发布接口暂不可用，请稍后重试" />
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
            立即发布
          </Button>
        </div>
      </div>
    </div>
  )
}
