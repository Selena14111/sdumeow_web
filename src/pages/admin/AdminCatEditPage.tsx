import { ArrowLeftOutlined, CameraOutlined } from '@ant-design/icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button, Form, Input, Select, message } from 'antd'
import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { ApiNotFoundError } from '@/api/adapters/errors'
import { deleteAdminCat, getAdminCats, upsertAdminCat } from '@/api/endpoints/admin'
import { ApiUnavailable } from '@/components/feedback/ApiUnavailable'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asArray, asRecord, asString, toPaged } from '@/utils/format'

type CatEditForm = {
  name: string
  color: string
  gender: string
  campus: string
  location?: string
  status: string
  neuteredType: string
  neuteredDate: string
  description: string
  tags: string[]
  healthScore: number
  affinityScore: number
}

const statusOptions = [
  { value: 'SCHOOL', label: '在校', icon: '🏫', activeClass: 'bg-[#22c55e] border-[#16a34a] text-white shadow-[0_8px_18px_rgba(34,197,94,0.35)]' },
  { value: 'GRADUATED', label: '毕业/被领养', icon: '🎓', activeClass: 'bg-[#3b82f6] border-[#2563eb] text-white shadow-[0_8px_18px_rgba(59,130,246,0.35)]' },
  { value: 'MEOW_STAR', label: '喵星', icon: '⭐', activeClass: 'bg-[#fff8e1] border-[#ffd54f] text-[#ffa000]' },
  { value: 'HOSPITAL', label: '住院', icon: '🏥', activeClass: 'bg-[#ffebee] border-[#ff5252] text-[#d32f2f]' },
]

const tagOptions = ['亲人', '吃货', '话痨', '高冷', '霸主', '学霸', '安静', '粘人', '胆小']
const colorOptions = [
  { label: '橘猫', value: '橘猫' },
  { label: '狸花', value: '狸花' },
  { label: '奶牛', value: '奶牛' },
  { label: '三花', value: '三花' },
  { label: '玳瑁', value: '玳瑁' },
  { label: '纯白', value: '纯白' },
  { label: '纯黑', value: '纯黑' },
  { label: '其他', value: '其他' },
]
const defaultResidenceLocation = '食堂'
const fallbackAvatarUrl = 'https://image.foofish.work/i/2026/02/25/699eecdb6731f-1772023003.png'

const campusCodeToLabelMap: Record<string, string> = {
  '0': '中心校区',
  '1': '趵突泉校区',
  '2': '洪家楼校区',
  '3': '千佛山校区',
  '4': '兴隆山校区',
  '5': '软件园校区',
  '6': '青岛校区',
  '7': '威海校区',
}

const campusLabelToCodeMap: Record<string, string> = {
  中心校区: '0',
  趵突泉校区: '1',
  洪家楼校区: '2',
  千佛山校区: '3',
  兴隆山校区: '4',
  软件园校区: '5',
  青岛校区: '6',
  威海校区: '7',
}

const campusCodeToEnumMap: Record<string, string> = {
  '0': 'CENTRAL',
  '1': 'BAOTUQUAN',
  '2': 'HONGJIALOU',
  '3': 'QIANFOSHAN',
  '4': 'XINGLONGSHAN',
  '5': 'SOFTWARE_PARK',
  '6': 'QINGDAO',
  '7': 'WEIHAI',
}

const campusOptions = Object.keys(campusCodeToLabelMap).map((code) => ({
  label: campusCodeToLabelMap[code],
  value: code,
}))

type EditableCat = CatEditForm & {
  avatar: string
}

const defaultCat: EditableCat = {
  name: '麻薯',
  color: '三花',
  gender: 'FEMALE',
  campus: '5',
  location: defaultResidenceLocation,
  status: 'SCHOOL',
  neuteredType: 'EAR_CUT',
  neuteredDate: '2023-11-13',
  description: '麻薯非常亲人，喜欢吃罐头。进食时不喜欢被摸头，偶尔会哈气。',
  tags: ['亲人', '吃货'],
  healthScore: 85,
  affinityScore: 70,
  avatar: fallbackAvatarUrl,
}

function resolveCatStatus(rawStatus: string): string {
  const status = rawStatus.toUpperCase()
  if (status.includes('HOSPITAL') || status.includes('TREAT')) return 'HOSPITAL'
  if (status.includes('MEOW') || status.includes('STAR')) return 'MEOW_STAR'
  if (status.includes('GRADUATE') || status.includes('ADOPTED')) return 'GRADUATED'
  if (status.includes('PENDING')) return 'SCHOOL'
  return 'SCHOOL'
}

function resolveNeuteredType(rawType: string): string {
  const value = rawType.toUpperCase()
  if (value.includes('EAR')) return 'EAR_CUT'
  if (value.includes('NONE') || value.includes('NO')) return 'NONE'
  return 'NORMAL'
}

function toEditableCat(item: unknown): EditableCat | null {
  const row = asRecord(item)
  const id = asString(row.id)
  if (!id) return null

  const neutered = asRecord(row.neutered)

  return {
    name: asString(row.name, defaultCat.name),
    color: asString(row.color, defaultCat.color),
    gender: asString(row.gender, defaultCat.gender),
    campus: normalizeCampusCode(row.campus),
    location: asString(row.location || row.locationName, defaultCat.location),
    status: resolveCatStatus(asString(row.status || row.statusText)),
    neuteredType: resolveNeuteredType(asString(neutered.type || row.neuteredType)),
    neuteredDate: asString(neutered.neuteredDate || row.neuteredDate, defaultCat.neuteredDate),
    description: asString(row.description, defaultCat.description),
    tags: asArray<string>(row.tags),
    healthScore: Number(row.healthScore ?? row.health ?? defaultCat.healthScore),
    affinityScore: Number(row.affinityScore ?? row.friendliness ?? defaultCat.affinityScore),
    avatar: asString(row.avatar || row.image),
  }
}

function normalizeCampusCode(rawCampus: unknown): string {
  if (typeof rawCampus === 'number' && Number.isFinite(rawCampus)) {
    const code = String(rawCampus)
    if (code in campusCodeToLabelMap) return code
  }

  if (typeof rawCampus === 'string') {
    const campus = rawCampus.trim()
    if (!campus) return '5'
    if (campus in campusCodeToLabelMap) return campus
    if (campus in campusLabelToCodeMap) return campusLabelToCodeMap[campus]

    const enumCode = Object.entries(campusCodeToEnumMap).find(([, enumValue]) => enumValue === campus)?.[0]
    if (enumCode) return enumCode
  }

  return '5'
}

function toTenScale(rawScore: number): number {
  return Number((Math.min(100, Math.max(0, rawScore)) / 10).toFixed(1))
}

function normalizeResidenceLocation(rawLocation: unknown): string {
  if (typeof rawLocation === 'string') {
    const location = rawLocation.trim()
    if (!location) return defaultResidenceLocation
    if (location.includes('食堂')) return '食堂'
    if (location.includes('宿舍')) return '宿舍楼'
    if (location.includes('教学')) return '教学楼'
    if (location.includes('图书')) return '图书馆'
    if (location === '其他') return location
  }

  return defaultResidenceLocation
}

function normalizeAvatarForSubmit(rawAvatar: string): string {
  const avatar = rawAvatar.trim()
  if (!avatar) return fallbackAvatarUrl
  if (/^data:image\//i.test(avatar) || /^blob:/i.test(avatar)) return fallbackAvatarUrl
  return avatar
}

function normalizeDateToYmd(rawDate: unknown): string {
  if (typeof rawDate !== 'string') return ''
  const value = rawDate.trim()
  if (!value) return ''
  const match = value.match(/\d{4}-\d{2}-\d{2}/)
  return match ? match[0] : ''
}

function toCreatePayload(values: CatEditForm, avatar: string): Record<string, unknown> {
  const campusCode = normalizeCampusCode(values.campus)
  const campusLabel = campusCodeToLabelMap[campusCode] ?? campusCodeToLabelMap['5']
  const campusEnum = campusCodeToEnumMap[campusCode] ?? campusCodeToEnumMap['5']
  const campusNumber = Number(campusCode)
  const location = normalizeResidenceLocation(values.location)
  const neuteredDate = normalizeDateToYmd(values.neuteredDate)
  const health10 = toTenScale(Number(values.healthScore))
  const affinity10 = toTenScale(Number(values.affinityScore))
  const attributeScore = {
    friendliness: affinity10,
    gluttony: health10,
    fight: health10,
    appearance: affinity10,
  }

  const shouldSendNeuteredDate = values.neuteredType !== 'NONE' && /^\d{4}-\d{2}-\d{2}$/.test(neuteredDate)

  return {
    name: values.name.trim(),
    avatar,
    color: values.color.trim(),
    gender: values.gender,
    campus: campusLabel,
    campusCode: campusNumber,
    campusEnum,
    location,
    locationName: location,
    status: values.status,
    tags: values.tags ?? [],
    description: values.description?.trim() ?? '',
    attributeScore,
    attributes: attributeScore,
    neuteredType: values.neuteredType,
    ...(shouldSendNeuteredDate ? { neuteredDate } : {}),
  }
}

function getStatusCandidates(uiStatus: string): string[] {
  const map: Record<string, string[]> = {
    SCHOOL: ['SCHOOL'],
    GRADUATED: ['GRADUATED'],
    MEOW_STAR: ['MEOW_STAR'],
    HOSPITAL: ['HOSPITAL'],
    // Backward compatibility for stale values in local state/history.
    PENDING_ADOPT: ['SCHOOL'],
    STAR: ['MEOW_STAR'],
  }

  return map[uiStatus] ?? [uiStatus]
}

export function AdminCatEditPage() {
  usePageTitle('编辑猫咪档案')
  const navigate = useNavigate()
  const location = useLocation()
  const { id = '1' } = useParams()
  const isCreateMode = id === 'new'
  const [form] = Form.useForm<CatEditForm>()
  const [initialized, setInitialized] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState('')
  const avatarInputId = 'admin-cat-avatar-upload'

  const currentStatus = Form.useWatch('status', form)
  const neuteredType = Form.useWatch('neuteredType', form)
  const selectedTags = Form.useWatch('tags', form) ?? []
  const healthScore = Form.useWatch('healthScore', form) ?? 85
  const affinityScore = Form.useWatch('affinityScore', form) ?? 70

  const catFromState = useMemo(() => {
    const stateRecord = asRecord(location.state)
    return toEditableCat(stateRecord.cat)
  }, [location.state])

  const listQuery = useQuery({
    queryKey: ['admin-cats'],
    queryFn: getAdminCats,
    enabled: !isCreateMode && !catFromState,
  })

  const catFromQuery = useMemo(() => {
    if (!listQuery.data?.data) return null
    const items = toPaged<Record<string, unknown>>(listQuery.data.data).items
    const matched = items.find((item) => asString(asRecord(item).id) === id)
    return matched ? toEditableCat(matched) : null
  }, [id, listQuery.data?.data])

  useEffect(() => {
    setInitialized(false)
  }, [id])

  useEffect(() => {
    if (initialized) return
    if (listQuery.isLoading && !isCreateMode && !catFromState) return

    const seed = isCreateMode ? defaultCat : (catFromState ?? catFromQuery ?? defaultCat)
    form.setFieldsValue({
      name: seed.name,
      color: seed.color,
      gender: seed.gender,
      campus: seed.campus,
      location: seed.location,
      status: seed.status,
      neuteredType: seed.neuteredType,
      neuteredDate: seed.neuteredDate,
      description: seed.description,
      tags: seed.tags,
      healthScore: seed.healthScore,
      affinityScore: seed.affinityScore,
    })
    setAvatarPreview(seed.avatar)
    setInitialized(true)
  }, [catFromQuery, catFromState, form, initialized, isCreateMode, listQuery.isLoading])

  useEffect(() => {
    if (neuteredType !== 'NONE') return
    const currentDate = form.getFieldValue('neuteredDate')
    const normalizedDate = normalizeDateToYmd(currentDate)
    if (currentDate !== normalizedDate) {
      form.setFieldValue('neuteredDate', normalizedDate)
    }
  }, [form, neuteredType])

  const mutation = useMutation({
    mutationFn: async (values: CatEditForm) => {
      const targetId = isCreateMode ? undefined : id
      const rawAvatar = avatarPreview.trim()

      const [status] = getStatusCandidates(values.status)
      const avatar = normalizeAvatarForSubmit(rawAvatar)
      if (avatar !== rawAvatar) {
        message.warning('后端当前不支持直接上传本地图片，已改用默认头像URL提交。')
      }

      return upsertAdminCat(toCreatePayload({ ...values, status }, avatar), targetId)
    },
    onSuccess: () => {
      message.success('档案已保存')
      if (isCreateMode) return
      navigate('/admin/cats', { replace: true })
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '保存失败，请稍后重试'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteAdminCat(id),
    onSuccess: () => {
      message.success('档案已删除')
      navigate('/admin/cats', { replace: true })
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '删除失败，请稍后重试'),
  })

  const onAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      message.warning('请选择图片文件')
      event.target.value = ''
      return
    }

    const reader = new FileReader()
    reader.onload = (loadEvent) => {
      if (typeof loadEvent.target?.result === 'string') {
        setAvatarPreview(loadEvent.target.result)
      }
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-36">
      <section className="mb-5 rounded-b-[24px] bg-white px-5 pb-5 pt-5 shadow-[0_2px_15px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button className="top-icon-btn !rounded-xl !bg-[#f5f5f5]" onClick={() => navigate(-1)} type="button">
              <ArrowLeftOutlined />
            </button>
            <h1 className="text-[20px] font-bold text-[#2c3e50]">{isCreateMode ? '新增猫咪档案' : '编辑猫咪档案'}</h1>
          </div>
          <button
            className="text-[14px] text-[#7f8c8d] disabled:text-[#cbd5e1]"
            disabled={isCreateMode || deleteMutation.isPending}
            onClick={() => deleteMutation.mutate()}
            type="button"
          >
            删除
          </button>
        </div>
      </section>

      <div className="h5-content pt-0">
        <div className="mb-4 rounded-[20px] bg-white p-5 text-center shadow-[0_4px_15px_rgba(0,0,0,0.03)]">
          <label
            className="mx-auto flex h-[120px] w-[120px] cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-black/10 bg-[#f5f5f5]"
            htmlFor={avatarInputId}
          >
            {avatarPreview ? (
              <img alt="猫咪头像" className="h-full w-full object-cover" src={avatarPreview} />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#d1d5db] to-[#94a3b8] text-white/85">
                <CameraOutlined className="text-[26px]" />
              </div>
            )}
          </label>
          <input accept="image/*" className="hidden" id={avatarInputId} onChange={onAvatarChange} type="file" />
          <p className="mt-2 text-[12px] text-[#7f8c8d]">点击图片更换头像</p>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={(values) => mutation.mutate(values)}
        >
          <section className="mb-4 rounded-[20px] bg-white p-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)]">
            <p className="mb-4 text-[14px] font-bold uppercase tracking-wide text-[#7f8c8d]">基础信息</p>

            <Form.Item label="猫咪名字" name="name" rules={[{ required: true, message: '请输入猫咪名字' }]}>
              <Input className="!h-11 !rounded-xl !border-none !bg-[#f8f9fa]" />
            </Form.Item>

            <div className="grid grid-cols-2 gap-3">
              <Form.Item label="花色" name="color" rules={[{ required: true, message: '请选择花色' }]}>
                <Select className="w-full" options={colorOptions} placeholder="请选择花色" />
              </Form.Item>
              <Form.Item label="性别" name="gender" rules={[{ required: true, message: '请选择性别' }]}>
                <Select
                  className="w-full"
                  options={[
                    { label: '母猫', value: 'FEMALE' },
                    { label: '公猫', value: 'MALE' },
                    { label: '未知', value: 'UNKNOWN' },
                  ]}
                />
              </Form.Item>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Form.Item label="所在校区" name="campus" rules={[{ required: true, message: '请选择所在校区' }]}>
                <Select className="w-full" options={campusOptions} />
              </Form.Item>

            </div>
          </section>

          <section className="mb-4 rounded-[20px] bg-white p-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)]">
            <p className="mb-3 text-[14px] font-bold uppercase tracking-wide text-[#7f8c8d]">状态设置</p>
            <Form.Item className="!mb-0" name="status" rules={[{ required: true, message: '请选择状态' }]}>
              <div className="grid grid-cols-2 gap-2">
                {statusOptions.map((option) => {
                  const active = currentStatus === option.value
                  return (
                    <button
                      aria-pressed={active}
                      key={option.value}
                      className={clsx(
                        'rounded-2xl border-2 px-3 py-3 text-center text-[13px] transition',
                        active ? option.activeClass : 'border-transparent bg-[#f8f9fa] text-[#7f8c8d]',
                      )}
                      onClick={() => form.setFieldValue('status', option.value)}
                      type="button"
                    >
                      <span className="mb-1 block text-[18px]">{option.icon}</span>
                      <span className="font-semibold">{option.label}</span>
                    </button>
                  )
                })}
              </div>
            </Form.Item>
          </section>

          <section className="mb-4 rounded-[20px] bg-white p-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)]">
            <p className="mb-3 text-[14px] font-bold uppercase tracking-wide text-[#7f8c8d]">属性评分</p>

            <Form.Item className="!mb-4" label="健康指数" name="healthScore" rules={[{ required: true, message: '请设置健康指数' }]}>
              <div>
                <div className="mb-2 flex items-center justify-between text-[13px]">
                  <span className="text-[#7f8c8d]">当前值</span>
                  <span className="font-bold text-[#ffa000]">{healthScore}</span>
                </div>
                <input
                  className="w-full accent-[#ffa726]"
                  max={100}
                  min={0}
                  onChange={(event) => form.setFieldValue('healthScore', Number(event.target.value))}
                  type="range"
                  value={healthScore}
                />
              </div>
            </Form.Item>

            <Form.Item className="!mb-0" label="亲人指数" name="affinityScore" rules={[{ required: true, message: '请设置亲人指数' }]}>
              <div>
                <div className="mb-2 flex items-center justify-between text-[13px]">
                  <span className="text-[#7f8c8d]">当前值</span>
                  <span className="font-bold text-[#ffa000]">{affinityScore}</span>
                </div>
                <input
                  className="w-full accent-[#ffa726]"
                  max={100}
                  min={0}
                  onChange={(event) => form.setFieldValue('affinityScore', Number(event.target.value))}
                  type="range"
                  value={affinityScore}
                />
              </div>
            </Form.Item>
          </section>

          <section className="mb-4 rounded-[20px] bg-white p-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)]">
            <p className="mb-3 text-[14px] font-bold uppercase tracking-wide text-[#7f8c8d]">标签特征</p>
            <Form.Item className="!mb-0" name="tags">
              <div className="flex flex-wrap gap-2">
                {tagOptions.map((tag) => {
                  const active = selectedTags.includes(tag)
                  return (
                    <button
                      key={tag}
                      className={clsx(
                        'rounded-full border px-3 py-1.5 text-[13px] transition',
                        active
                          ? 'border-transparent bg-[#ffd54f] font-semibold text-[#5d4037] shadow-[0_4px_10px_rgba(255,213,79,0.3)]'
                          : 'border-transparent bg-[#f5f5f5] text-[#7f8c8d]',
                      )}
                      onClick={() => {
                        const next = active ? selectedTags.filter((item) => item !== tag) : [...selectedTags, tag]
                        form.setFieldValue('tags', next)
                      }}
                      type="button"
                    >
                      {tag}
                    </button>
                  )
                })}
              </div>
            </Form.Item>
          </section>

          <section className="mb-4 rounded-[20px] bg-white p-4 shadow-[0_4px_15px_rgba(0,0,0,0.03)]">
            <p className="mb-4 text-[14px] font-bold uppercase tracking-wide text-[#7f8c8d]">其他信息</p>

            <div className="grid grid-cols-2 gap-3">
              <Form.Item label="绝育方式" name="neuteredType">
                <Select
                  options={[
                    { label: '耳尖标记', value: 'EAR_CUT' },
                    { label: '已绝育（无耳标）', value: 'NORMAL' },
                    { label: '未绝育', value: 'NONE' },
                  ]}
                />
              </Form.Item>

              <Form.Item label="绝育日期" name="neuteredDate">
                <Input className="!h-11 !rounded-xl !border-none !bg-[#f8f9fa]" type="date" />
              </Form.Item>
            </div>

            <Form.Item label="备注描述" name="description">
              <Input.TextArea className="!rounded-xl !border-none !bg-[#f8f9fa]" rows={4} />
            </Form.Item>
          </section>
        </Form>

        {mutation.error instanceof ApiNotFoundError ? <ApiUnavailable title="猫咪保存接口暂不可用" /> : null}
      </div>

      <div className="fixed bottom-6 left-1/2 z-30 grid w-[min(350px,calc(100%-34px))] -translate-x-1/2 grid-cols-2 gap-3 rounded-3xl border border-white/40 bg-white/90 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.1)] backdrop-blur-xl">
        <Button
          className="!h-12 !rounded-2xl !border-none !bg-white !text-[14px] !font-bold !text-[#475569]"
          onClick={() => navigate(-1)}
          type="text"
        >
          取消返回
        </Button>
        <Button
          className="!h-12 !rounded-2xl !border-none !text-[14px] !font-bold !text-[#5d4037]"
          loading={mutation.isPending}
          onClick={() => form.submit()}
          style={{
            background: 'linear-gradient(135deg, #FFD54F 0%, #FFCA28 100%)',
            boxShadow: '0 4px 15px rgba(255, 213, 79, 0.4)',
          }}
          type="text"
        >
          保存档案
        </Button>
      </div>
    </div>
  )
}
