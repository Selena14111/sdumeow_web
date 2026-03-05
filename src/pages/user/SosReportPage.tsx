import {
  CameraOutlined,
  CloseOutlined,
  DeleteOutlined,
  ExclamationCircleFilled,
  PictureOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button, Form, Input, Modal, Select, message } from 'antd'
import clsx from 'clsx'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import { getCats } from '@/api/endpoints/cats'
import { createSos, getSosTags } from '@/api/endpoints/sos'
import { QueryState } from '@/components/feedback/QueryState'
import { useCampus } from '@/hooks/useCampus'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asArray, asRecord, asString, toPaged } from '@/utils/format'

type SosForm = {
  catId: string
  campus: string
  symptoms: string[]
  description: string
  location: string
}

type LocalMediaItem = {
  id: string
  file: File
  dataUrl: string
}

const fallbackSymptoms = ['外伤出血', '呼吸困难', '无法站立', '口炎/流涎', '车祸/撞击', '精神萎靡']

const campusOptions = [
  { label: '中心校区', value: '0' },
  { label: '趵突泉校区', value: '1' },
  { label: '洪家楼校区', value: '2' },
  { label: '千佛山校区', value: '3' },
  { label: '兴隆山校区', value: '4' },
  { label: '软件园校区', value: '5' },
  { label: '青岛校区', value: '6' },
  { label: '威海校区', value: '7' },
]

const campusValueToCodeMap: Record<string, string> = {
  CENTRAL: '0',
  BAOTUQUAN: '1',
  HONGJIALOU: '2',
  QIANFOSHAN: '3',
  XINGLONGSHAN: '4',
  SOFTWARE_PARK: '5',
  QINGDAO: '6',
  WEIHAI: '7',
}

function normalizeCampusCode(value: unknown): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    const code = String(value)
    return campusOptions.some((item) => item.value === code) ? code : '5'
  }

  if (typeof value === 'string') {
    const campus = value.trim()
    if (!campus) return '5'
    if (campusOptions.some((item) => item.value === campus)) return campus

    const upper = campus.toUpperCase()
    if (upper in campusValueToCodeMap) return campusValueToCodeMap[upper]
  }

  return '5'
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

export function SosReportPage() {
  usePageTitle('紧急病情上报')
  const navigate = useNavigate()
  const { campus } = useCampus()
  const [form] = Form.useForm<SosForm>()
  const [mediaList, setMediaList] = useState<LocalMediaItem[]>([])
  const [successModalOpen, setSuccessModalOpen] = useState(false)
  const selectedSymptoms = Form.useWatch('symptoms', form) ?? []
  const selectedCampus = Form.useWatch('campus', form) ?? normalizeCampusCode(campus)
  const selectedCatId = Form.useWatch('catId', form)
  const albumInputRef = useRef<HTMLInputElement | null>(null)
  const cameraInputRef = useRef<HTMLInputElement | null>(null)

  const tagsQuery = useQuery({
    queryKey: ['sos-tags'],
    queryFn: getSosTags,
  })

  const catsQuery = useQuery({
    queryKey: ['sos-cats', selectedCampus],
    queryFn: () =>
      getCats({
        page: 1,
        pageSize: 200,
        campus: selectedCampus,
      }),
  })

  const mutation = useMutation({
    mutationFn: (payload: SosForm) =>
      createSos({
        catId: payload.catId,
        campus: Number(payload.campus),
        location: payload.location.trim(),
        symptoms: payload.symptoms,
        description: payload.description.trim(),
        media: mediaList.map((item) => item.file),
      }),
    onSuccess: () => {
      setSuccessModalOpen(true)
      form.resetFields(['catId', 'symptoms', 'description', 'location'])
      setMediaList([])
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '上报失败，请稍后重试'),
  })

  const tags = asArray<string>(tagsQuery.data?.data)
  const symptomOptions = tags.length ? tags : fallbackSymptoms

  const catOptions = useMemo(() => {
    const items = toPaged<Record<string, unknown>>(catsQuery.data?.data).items
    return items.map((item) => {
      const row = asRecord(item)
      const id = asString(row.id)
      const name = asString(row.name, '未命名猫咪')
      const color = asString(row.color)
      const location = asString(row.locationName)
      return {
        value: id,
        label: `${name}${color ? `（${color}）` : ''}${location ? ` · ${location}` : ''}`,
      }
    })
  }, [catsQuery.data?.data])

  useEffect(() => {
    form.setFieldValue('campus', normalizeCampusCode(campus))
  }, [campus, form])

  useEffect(() => {
    if (!selectedCatId) return
    if (catOptions.some((item) => item.value === selectedCatId)) return
    form.setFieldValue('catId', undefined)
  }, [catOptions, form, selectedCatId])

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

  const handleSubmit = (values: SosForm) => {
    if (mediaList.length === 0) {
      message.error('请至少上传 1 张现场图片')
      return
    }

    mutation.mutate(values)
  }

  const handleSubmitFailed = (errorInfo: { errorFields?: Array<{ errors?: string[] }> }) => {
    const firstError = errorInfo.errorFields?.[0]?.errors?.[0]
    if (firstError) {
      message.warning(firstError)
    }
  }

  return (
    <div className="pb-5">
      <section className="mb-4 rounded-b-[30px] bg-gradient-to-br from-[#ffebee] to-[#ffcdd2] px-5 pb-5 pt-5 text-center text-[#c62828]">
        <div className="mb-3 flex justify-start">
          <button className="top-icon-btn !h-8 !w-8 !bg-transparent !text-[#c62828] shadow-none" type="button" onClick={() => navigate(-1)}>
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
        <Form
          form={form}
          initialValues={{
            campus: normalizeCampusCode(campus),
            symptoms: [],
          }}
          layout="vertical"
          onSubmitCapture={(event) => event.preventDefault()}
          onFinish={handleSubmit}
          onFinishFailed={handleSubmitFailed}
        >
          <Form.Item label="发生校区" name="campus" rules={[{ required: true, message: '请选择校区' }]}>
            <Select options={campusOptions} placeholder="请选择校区" />
          </Form.Item>

          <Form.Item label="涉及猫咪" name="catId" rules={[{ required: true, message: '请选择涉及猫咪' }]}>
            <QueryState error={catsQuery.error} isLoading={catsQuery.isLoading}>
              <Select
                allowClear
                showSearch
                filterOption={(input, option) => asString(option?.label).toLowerCase().includes(input.toLowerCase())}
                options={catOptions}
                placeholder={catOptions.length ? '请选择猫咪' : '当前校区暂无猫咪，请先切换校区'}
                value={selectedCatId}
                onChange={(value) => form.setFieldValue('catId', value)}
              />
            </QueryState>
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
                        checked ? 'border-[#d32f2f] bg-[#ffebee] font-semibold text-[#d32f2f]' : 'border-[#ddd] bg-white text-[#666]',
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

          <section className="mb-4 rounded-2xl border border-[#fecdd3] bg-[#fff1f2] p-3">
            <p className="mb-2 text-[12px] font-semibold text-[#d32f2f]">拍摄现场情况（至少 1 张）</p>
            <div className="mb-3 grid grid-cols-2 gap-2">
              <button
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-white text-[13px] font-semibold text-[#ef6c00]"
                type="button"
                onClick={() => albumInputRef.current?.click()}
              >
                <PictureOutlined />
                从相册选择
              </button>
              <button
                className="flex h-11 items-center justify-center gap-2 rounded-xl bg-white text-[13px] font-semibold text-[#c62828]"
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
                    <img alt="现场图片" className="h-full w-full object-cover" src={item.dataUrl} />
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
              <div className="flex h-20 flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#fda4af] text-[#d32f2f]">
                <CameraOutlined className="text-[20px]" />
                <p className="mt-1 text-[12px]">尚未添加图片</p>
              </div>
            )}
          </section>

          <Form.Item label="发生位置" name="location" rules={[{ required: true, message: '请输入具体位置' }]}>
            <Input className="!h-11 !rounded-xl !bg-white" placeholder="例如：食堂门口" />
          </Form.Item>

          <Button
            block
            className="!h-[50px] !rounded-full !border-none !text-[15px] !font-semibold"
            htmlType="button"
            loading={mutation.isPending}
            style={{ background: 'linear-gradient(135deg, #ff5252 0%, #d32f2f 100%)' }}
            type="primary"
            onClick={() => form.submit()}
          >
            立即上报求助
          </Button>
        </Form>
      </div>

      <Modal open={successModalOpen} title="已成功上报" okText="知道了" cancelButtonProps={{ style: { display: 'none' } }} onOk={() => setSuccessModalOpen(false)} onCancel={() => setSuccessModalOpen(false)}>
        我们已收到你的求助信息，请保持电话畅通。
      </Modal>
    </div>
  )
}
