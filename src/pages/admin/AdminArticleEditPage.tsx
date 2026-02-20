import { ArrowLeftOutlined } from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import { Button, Card, Form, Input, Segmented, message } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'

import { ApiNotFoundError } from '@/api/adapters/errors'
import { upsertAdminArticle } from '@/api/endpoints/articles'
import { ApiUnavailable } from '@/components/feedback/ApiUnavailable'
import { usePageTitle } from '@/hooks/usePageTitle'

export function AdminArticleEditPage() {
  usePageTitle('编辑科普文章')
  const navigate = useNavigate()
  const { id = '1' } = useParams()
  const [form] = Form.useForm()

  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => upsertAdminArticle(payload, id),
    onSuccess: () => message.success('文章已保存'),
    onError: (error) => message.error(error instanceof Error ? error.message : '保存失败'),
  })

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-[#f3f4f6] px-5 pb-20 pt-4">
      <div className="mb-5 rounded-b-3xl bg-white px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button className="!h-9 !w-9" icon={<ArrowLeftOutlined />} shape="circle" onClick={() => navigate(-1)} />
            <h1 className="text-4xl font-black text-[#263246]">编辑科普文章</h1>
          </div>
          <Button className="!rounded-2xl" loading={mutation.isPending} onClick={() => form.submit()}>
            保存
          </Button>
        </div>
      </div>

      <Form
        form={form}
        initialValues={{
          title: '流浪猫常见疾病防治指南',
          category: '健康科普',
          summary: '流浪猫在野外生活中容易接触到各种疾病，了解常见疾病的症状和预防措施对关爱流浪猫至关重要。',
          content: '# 流浪猫常见疾病防治指南\n\n## 一、猫瘟（FPV）\n猫瘟是由猫细小病毒引起的高度传染性疾病。',
        }}
        layout="vertical"
        onFinish={(values) => mutation.mutate(values)}
      >
        <Form.Item label="文章封面" name="coverImage">
          <Card className="!rounded-2xl !border-dashed !border-[#b7c7e0] !bg-[#ecf3ff]" size="small">
            <div className="h-28 text-center text-[#8da0bd]">
              <p className="pt-9 text-lg">点击上传封面图片</p>
              <p className="text-xs">建议尺寸 600×300，支持 JPG/PNG</p>
            </div>
          </Card>
        </Form.Item>

        <Form.Item label="文章标题" name="title" rules={[{ required: true, message: '请输入标题' }]}>
          <Input className="!h-12 !rounded-2xl" />
        </Form.Item>

        <Form.Item label="文章分类" name="category" rules={[{ required: true, message: '请选择分类' }]}>
          <Segmented
            block
            options={[
              { label: '健康科普', value: '健康科普' },
              { label: '营养知识', value: '营养知识' },
              { label: '行为解读', value: '行为解读' },
              { label: 'TNR 科普', value: 'TNR 科普' },
            ]}
          />
        </Form.Item>

        <Form.Item label="文章摘要" name="summary">
          <Input.TextArea className="!rounded-2xl" rows={5} />
        </Form.Item>

        <Form.Item label="正文内容" name="content" rules={[{ required: true, message: '请输入正文' }]}>
          <Input.TextArea className="!rounded-2xl" rows={12} />
        </Form.Item>
      </Form>

      {mutation.error instanceof ApiNotFoundError ? <ApiUnavailable title="文章发布接口暂不可用" /> : null}
    </div>
  )
}
