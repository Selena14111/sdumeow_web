import { CameraOutlined, CloseOutlined, ExclamationCircleFilled, PhoneFilled, UserSwitchOutlined } from '@ant-design/icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button, Form, Input, message } from 'antd'
import clsx from 'clsx'
import { useNavigate } from 'react-router-dom'

import { createSos, getSosTags } from '@/api/endpoints/sos'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asArray } from '@/utils/format'

type SosForm = {
  catId?: string
  symptoms: string[]
  description: string
  location?: string
}

const fallbackSymptoms = ['外伤出血', '呼吸困难', '无法站立', '口炎/流涎', '车祸/撞击', '精神萎靡']

export function SosReportPage() {
  usePageTitle('紧急病情上报')
  const navigate = useNavigate()
  const [form] = Form.useForm<SosForm>()
  const selectedSymptoms = Form.useWatch('symptoms', form) ?? []

  const tagsQuery = useQuery({
    queryKey: ['sos-tags'],
    queryFn: getSosTags,
  })

  const mutation = useMutation({
    mutationFn: (payload: SosForm) => createSos(payload),
    onSuccess: () => message.success('已上报，管理员正在处理'),
    onError: (error) => message.error(error instanceof Error ? error.message : '上报失败'),
  })

  const tags = asArray<string>(tagsQuery.data?.data)
  const symptomOptions = tags.length ? tags : fallbackSymptoms

  return (
    <div className="pb-5">
      <section className="mb-4 rounded-b-[30px] bg-gradient-to-br from-[#ffebee] to-[#ffcdd2] px-5 pb-5 pt-5 text-center text-[#c62828]">
        <div className="mb-3 flex justify-start">
          <button
            className="top-icon-btn !h-8 !w-8 !bg-transparent !text-[#c62828] shadow-none"
            type="button"
            onClick={() => navigate(-1)}
          >
            <CloseOutlined />
          </button>
        </div>
        <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-white text-[30px] shadow-[0_10px_20px_rgba(211,47,47,0.2)]">
          <ExclamationCircleFilled />
        </div>
        <h1 className="text-[24px] font-extrabold">紧急病情上报</h1>
        <p className="mt-1 text-[12px] text-[#d05b66]">请确保自身安全的情况下进行救助</p>
      </section>

      <div className="h5-content pt-0">
        <div className="mb-5 grid grid-cols-2 gap-3">
          <a
            className="rounded-2xl bg-[#e8f5e9] px-3 py-3 text-center text-[#2e7d32]"
            href="tel:12345678"
          >
            <PhoneFilled className="mb-1 text-[18px]" />
            <p className="text-[12px] font-semibold">联系校医</p>
          </a>
          <a
            className="rounded-2xl bg-[#e3f2fd] px-3 py-3 text-center text-[#1565c0]"
            href="tel:87654321"
          >
            <UserSwitchOutlined className="mb-1 text-[18px]" />
            <p className="text-[12px] font-semibold">协会负责人</p>
          </a>
        </div>

        <Form form={form} initialValues={{ symptoms: [] }} layout="vertical" onFinish={(values) => mutation.mutate(values)}>
          <Form.Item label="涉及猫咪" name="catId">
            <Input className="!h-11 !rounded-xl !bg-white" placeholder="点击选择（如不认识选“未知”）" />
          </Form.Item>

          <Form.Item label="主要症状（多选）" name="symptoms" rules={[{ required: true, message: '请至少选择一个症状' }]}>
            <QueryState error={tagsQuery.error} isLoading={tagsQuery.isLoading}>
              <div className="flex flex-wrap gap-2">
                {symptomOptions.map((tag) => {
                  const checked = selectedSymptoms.includes(tag)
                  return (
                    <button
                      key={tag}
                      className={clsx(
                        'rounded-full border px-3 py-1.5 text-[12px] transition',
                        checked
                          ? 'border-[#d32f2f] bg-[#ffebee] font-semibold text-[#d32f2f]'
                          : 'border-[#ddd] bg-white text-[#666]',
                      )}
                      type="button"
                      onClick={() => {
                        const next = new Set(selectedSymptoms)
                        if (next.has(tag)) {
                          next.delete(tag)
                        } else {
                          next.add(tag)
                        }
                        form.setFieldValue('symptoms', Array.from(next))
                      }}
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>
            </QueryState>
          </Form.Item>

          <Form.Item label="具体症状" name="description" rules={[{ required: true, message: '请补充细节描述' }]}>
            <Input.TextArea className="!rounded-xl !bg-white" placeholder="请详细描述症状、行为变化、是否有攻击倾向..." rows={4} />
          </Form.Item>

          <div className="mb-4 flex h-24 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#ffccd2] bg-[#ffebee] text-[#d32f2f]">
            <CameraOutlined className="text-[22px]" />
            <p className="mt-1 text-[12px]">拍摄现场情况</p>
          </div>

          <Form.Item label="发生位置" name="location" rules={[{ required: true, message: '请输入具体位置' }]}>
            <Input className="!h-11 !rounded-xl !bg-white" placeholder="例如：食堂北门灌木丛" />
          </Form.Item>

          <Button
            block
            className="!h-[50px] !rounded-full !border-none !text-[15px] !font-semibold"
            htmlType="submit"
            loading={mutation.isPending}
            style={{ background: 'linear-gradient(135deg, #ff5252 0%, #d32f2f 100%)' }}
            type="primary"
          >
            立即上报求助
          </Button>
        </Form>
      </div>
    </div>
  )
}
