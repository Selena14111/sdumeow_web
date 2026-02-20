import { ArrowLeftOutlined } from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import { Button, Card, Form, Input, Switch, message } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'

import { ApiNotFoundError } from '@/api/adapters/errors'
import { upsertAdminAnnouncement } from '@/api/endpoints/admin'
import { ApiUnavailable } from '@/components/feedback/ApiUnavailable'
import { usePageTitle } from '@/hooks/usePageTitle'

export function AdminAnnouncementEditPage() {
  usePageTitle('编辑公告')
  const navigate = useNavigate()
  const { id = '1' } = useParams()
  const [form] = Form.useForm()

  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => upsertAdminAnnouncement(payload, id),
    onSuccess: () => message.success('公告已保存'),
    onError: (error) => message.error(error instanceof Error ? error.message : '保存失败'),
  })

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-[#f3f4f6] px-5 pb-20 pt-4">
      <div className="mb-5 rounded-b-3xl bg-white px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button className="!h-9 !w-9" icon={<ArrowLeftOutlined />} shape="circle" onClick={() => navigate(-1)} />
            <h1 className="text-4xl font-black text-[#263246]">编辑公告内容</h1>
          </div>
          <Button className="!rounded-2xl" loading={mutation.isPending} onClick={() => form.submit()}>
            保存
          </Button>
        </div>
      </div>

      <Form
        form={form}
        initialValues={{
          title: '关于2025年寒假期间校园猫咪管理工作的通知',
          content: '各位师生：\n\n寒假将至，离校在即。为确保校园猫咪在假期期间得到妥善照顾，SDU Meow 协会现将寒假期间管理安排通知如下...',
          isPinned: true,
        }}
        layout="vertical"
        onFinish={(values) => mutation.mutate(values)}
      >
        <Form.Item label="公告标题" name="title" rules={[{ required: true, message: '请输入标题' }]}>
          <Input className="!h-12 !rounded-2xl" />
        </Form.Item>

        <Form.Item label="正文内容" name="content" rules={[{ required: true, message: '请输入正文内容' }]}>
          <Input.TextArea className="!rounded-2xl" rows={8} />
        </Form.Item>

        <Card className="!mb-5 !rounded-3xl !border-none" title={<span className="text-2xl font-black">发布设置</span>}>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-black text-[#313a4b]">置顶显示</span>
            <Form.Item className="!mb-0" name="isPinned" valuePropName="checked">
              <Switch defaultChecked />
            </Form.Item>
          </div>
        </Card>

        <Button block className="!h-12 !rounded-2xl !text-2xl !font-black" htmlType="submit">
          立即发布公告
        </Button>
      </Form>

      {mutation.error instanceof ApiNotFoundError ? (
        <div className="mt-4">
          <ApiUnavailable title="公告发布接口暂不可用" />
        </div>
      ) : null}
    </div>
  )
}
