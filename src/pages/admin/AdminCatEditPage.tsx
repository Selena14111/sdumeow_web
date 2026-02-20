import { ArrowLeftOutlined } from '@ant-design/icons'
import { useMutation } from '@tanstack/react-query'
import { Button, Card, Form, Input, Segmented, Select, Tag, message } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'

import { ApiNotFoundError } from '@/api/adapters/errors'
import { upsertAdminCat } from '@/api/endpoints/admin'
import { ApiUnavailable } from '@/components/feedback/ApiUnavailable'
import { usePageTitle } from '@/hooks/usePageTitle'

export function AdminCatEditPage() {
  usePageTitle('编辑猫咪档案')
  const navigate = useNavigate()
  const { id = '1' } = useParams()
  const [form] = Form.useForm()

  const mutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) => upsertAdminCat(payload, id),
    onSuccess: () => message.success('档案已保存'),
    onError: (error) => message.error(error instanceof Error ? error.message : '保存失败'),
  })

  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-[#f3f4f6] px-5 pb-24 pt-4">
      <div className="mb-4 rounded-b-3xl bg-white px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button className="!h-9 !w-9" icon={<ArrowLeftOutlined />} shape="circle" onClick={() => navigate(-1)} />
            <h1 className="text-4xl font-black text-[#263246]">编辑猫咪档案</h1>
          </div>
          <button className="text-sm text-[#c0c0c0]">删除</button>
        </div>
      </div>

      <Card className="!mb-4 !rounded-3xl !border-none">
        <div className="mx-auto h-28 w-28 rounded-full bg-slate-300" />
        <p className="mt-2 text-center text-[#a0a0a0]">点击图片更换头像</p>
      </Card>

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
          description: '麻薯非常亲人，喜欢吃罐头，吃饭时不喜欢被摸头会哈气。',
        }}
        layout="vertical"
        onFinish={(values) => mutation.mutate(values)}
      >
        <Card className="!mb-4 !rounded-3xl !border-none" title={<span className="text-lg font-semibold text-[#9ca3af]">基本信息</span>}>
          <Form.Item label="猫咪名字" name="name" rules={[{ required: true, message: '请输入名字' }]}>
            <Input className="!h-11 !rounded-2xl" />
          </Form.Item>
          <Form.Item label="花色/品种" name="color">
            <Input className="!h-11 !rounded-2xl" />
          </Form.Item>
          <Form.Item label="性别" name="gender">
            <Select className="!h-11" options={[{ label: '母猫', value: 'FEMALE' }, { label: '公猫', value: 'MALE' }]} />
          </Form.Item>
          <Form.Item label="常驻地点" name="location">
            <Input className="!h-11 !rounded-2xl" />
          </Form.Item>

          <div className="mb-2 grid grid-cols-2 gap-3">
            <Button block className="!h-11 !rounded-2xl" onClick={() => navigate(-1)}>
              取消
            </Button>
            <Button block className="!h-11 !rounded-2xl !border-none !bg-[#f4cc45] !font-bold" htmlType="submit" loading={mutation.isPending} type="primary">
              保存
            </Button>
          </div>

          <Form.Item label="状态" name="status">
            <Segmented
              block
              options={[
                { label: '在校', value: 'SCHOOL' },
                { label: '待领养', value: 'PENDING_ADOPT' },
                { label: '已毕业', value: 'GRADUATED' },
                { label: '喵星', value: 'MEOW_STAR' },
              ]}
            />
          </Form.Item>
        </Card>

        <Card className="!mb-4 !rounded-3xl !border-none" title={<span className="text-lg font-semibold text-[#9ca3af]">猫格属性</span>}>
          <div className="space-y-2">
            {[
              ['亲人指数', '9.0', '#f4cc45'],
              ['贪吃指数', '9.5', '#f5a623'],
              ['战斗力', '4.0', '#6cc27d'],
              ['颜值指数', '10.0', '#ea9bc5'],
            ].map(([name, value, color]) => (
              <div key={String(name)}>
                <div className="mb-1 flex items-center justify-between text-sm"><span>{name}</span><span className="text-[#f4b000]">{value}</span></div>
                <div className="h-2 rounded-full bg-[#edf1f5]">
                  <div className="h-2 rounded-full" style={{ width: `${Number(value) * 10}%`, backgroundColor: String(color) }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {['亲人', '吃货', '话痨', '高冷', '霸主', '学霸', '安静', '粘人', '胆小'].map((tag, idx) => (
              <Tag key={tag} color={idx < 2 ? 'gold' : 'default'}>{tag}</Tag>
            ))}
          </div>
        </Card>

        <Card className="!rounded-3xl !border-none" title={<span className="text-lg font-semibold text-[#9ca3af]">其他信息</span>}>
          <Form.Item label="绝育情况" name="neuteredType">
            <Select options={[{ label: '已绝育（剪耳）', value: 'EAR_CUT' }, { label: '未绝育', value: 'UNCUT' }]} />
          </Form.Item>
          <Form.Item label="绝育日期" name="neuteredDate">
            <Input className="!h-11 !rounded-2xl" />
          </Form.Item>
          <Form.Item label="备注说明" name="description">
            <Input.TextArea className="!rounded-2xl" rows={4} />
          </Form.Item>
        </Card>
      </Form>

      {mutation.error instanceof ApiNotFoundError ? <div className="mt-4"><ApiUnavailable title="猫咪保存接口暂不可用" /></div> : null}
    </div>
  )
}
