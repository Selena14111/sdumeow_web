import { ArrowLeftOutlined } from '@ant-design/icons'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button, Form, Input, Modal, Select, Switch, message } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'

import { ApiNotFoundError } from '@/api/adapters/errors'
import { getAdminAnnouncements, upsertAdminAnnouncement } from '@/api/endpoints/admin'
import { getAnnouncementTypes } from '@/api/endpoints/types'
import { ApiUnavailable } from '@/components/feedback/ApiUnavailable'
import { usePageTitle } from '@/hooks/usePageTitle'
import { getAnnouncementTypeOptions, normalizeAnnouncementTypeId } from '@/utils/announcementTypes'
import { asRecord, asString, toPaged } from '@/utils/format'

type SaveMode = 'draft' | 'published'

type AnnouncementFormValues = {
  title: string
  content: string
  isPinned: boolean
  type: number
}

type EditableNotice = AnnouncementFormValues

const emptyNotice: EditableNotice = {
  title: '',
  content: '',
  isPinned: false,
  type: 3,
}

function asNoticeId(value: unknown, fallback = ''): string {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'string' && value.trim()) return value
  return fallback
}

function normalizePinned(row: Record<string, unknown>): boolean {
  return Boolean(row.pinned ?? row.isPinned ?? row.top ?? row.isTop)
}

function toEditableNotice(item: unknown): EditableNotice | null {
  const row = asRecord(item)
  const id = asNoticeId(row.id ?? row.announcementId ?? row.noticeId)
  if (!id) return null

  return {
    title: asString(row.title),
    content: asString(row.content || row.summary || row.description),
    isPinned: normalizePinned(row),
    type: normalizeAnnouncementTypeId(row.type ?? row.category),
  }
}

function getResultId(value: unknown): string {
  const record = asRecord(value)
  return asNoticeId(record.id || record.announcementId || record.noticeId)
}

export function AdminAnnouncementEditPage() {
  usePageTitle('编辑公告内容')
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()
  const { id = 'new' } = useParams()
  const [form] = Form.useForm<AnnouncementFormValues>()
  const isCreateMode = id === 'new'
  const [initialized, setInitialized] = useState(false)

  const noticeFromState = useMemo(() => {
    const stateRecord = asRecord(location.state)
    return toEditableNotice(stateRecord.notice)
  }, [location.state])

  const listQuery = useQuery({
    queryKey: ['admin-announcements', 'edit-source', id],
    queryFn: () => getAdminAnnouncements({ page: 1, size: 100, pageSize: 100 }),
    enabled: !isCreateMode && !noticeFromState,
  })
  const typesQuery = useQuery({
    queryKey: ['type', 'announcement-types'],
    queryFn: getAnnouncementTypes,
  })
  const announcementTypeOptions = useMemo(() => getAnnouncementTypeOptions(typesQuery.data?.data), [typesQuery.data?.data])

  const noticeFromQuery = useMemo(() => {
    if (!listQuery.data?.data) return null
    const rawItems = Array.isArray(listQuery.data.data) ? listQuery.data.data : toPaged<Record<string, unknown>>(listQuery.data.data).items
    const matched = rawItems.find((item) => asNoticeId(asRecord(item).id ?? asRecord(item).announcementId ?? asRecord(item).noticeId) === id)
    return matched ? toEditableNotice(matched) : null
  }, [id, listQuery.data?.data])

  useEffect(() => {
    setInitialized(false)
  }, [id])

  useEffect(() => {
    if (initialized) return
    if (listQuery.isLoading && !isCreateMode && !noticeFromState) return

    const seed = isCreateMode ? emptyNotice : noticeFromState ?? noticeFromQuery ?? emptyNotice
    form.setFieldsValue({
      title: seed.title,
      content: seed.content,
      isPinned: seed.isPinned,
      type: seed.type,
    })
    setInitialized(true)
  }, [form, initialized, isCreateMode, listQuery.isLoading, noticeFromQuery, noticeFromState])

  const mutation = useMutation({
    mutationFn: ({ values, mode }: { values: AnnouncementFormValues; mode: SaveMode }) =>
      upsertAdminAnnouncement(
        {
          title: values.title,
          content: values.content,
          summary: values.content.slice(0, 120),
          type: values.type,
          status: mode === 'published' ? 'PUBLISHED' : 'DRAFT',
          pinned: values.isPinned,
          isPinned: values.isPinned,
        },
        isCreateMode ? undefined : id,
      ),
    onSuccess: (result, variables) => {
      void queryClient.invalidateQueries({ queryKey: ['admin-announcements'] })
      const nextId = variables.mode === 'draft' && isCreateMode ? getResultId(result.data) : ''
      Modal.success({
        title: variables.mode === 'draft' ? '保存成功' : '发布成功',
        content: variables.mode === 'draft' ? '公告已保存' : '公告已发布',
        okText: '知道了',
        onOk: () => {
          if (variables.mode === 'draft' && isCreateMode && nextId) {
            navigate(`/admin/announcements/${nextId}/edit`, { replace: true })
            return
          }

          if (variables.mode === 'published') {
            navigate('/admin/announcements', { replace: true })
          }
        },
      })

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
      <section className="mb-5 rounded-b-[28px] bg-white px-5 pb-8 pt-6 shadow-[0_8px_24px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              className="!h-10 !w-10 !border-none !bg-[#f5f5f5] !text-[#0f172a]"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
              shape="circle"
              type="text"
            />
            <h1 className="text-[22px] font-extrabold text-[#2c3e50]">编辑公告内容</h1>
          </div>
        </div>
      </section>

      <div className="h5-content pt-0">
        <Form form={form} layout="vertical" requiredMark={false}>
          <Form.Item
            label={<span className="text-[15px] font-extrabold text-[#2c3e50]">公告标题</span>}
            name="title"
            rules={[{ required: true, message: '请输入公告标题' }]}
          >
            <Input
              className="!h-12 !rounded-2xl !border-[#e5e7eb] !bg-white !px-4 !text-[14px]"
              placeholder="请输入公告标题"
            />
          </Form.Item>

          <Form.Item
            label={<span className="text-[15px] font-extrabold text-[#2c3e50]">正文内容</span>}
            name="content"
            rules={[{ required: true, message: '请输入正文内容' }]}
          >
            <Input.TextArea
              className="!rounded-2xl !border-[#e5e7eb] !bg-white !px-4 !py-3 !text-[14px] !leading-7"
              placeholder="请输入公告正文"
              rows={10}
            />
          </Form.Item>

          <h2 className="mb-3 px-1 text-[15px] font-extrabold text-[#2c3e50]">发布设置</h2>
          <div className="mb-3 rounded-2xl border border-[#e5e7eb] bg-white px-5 py-4">
            <Form.Item
              className="!mb-0"
              label={<span className="text-[15px] font-bold text-[#2c3e50]">公告类型</span>}
              name="type"
              rules={[{ required: true, message: '请选择公告类型' }]}
            >
              <Select
                className="!h-11"
                loading={typesQuery.isLoading}
                options={announcementTypeOptions.map((option) => ({ label: option.label, value: option.value }))}
                placeholder="请选择公告类型"
              />
            </Form.Item>
          </div>
          <div className="mb-4 rounded-2xl border border-[#e5e7eb] bg-white px-5 py-4">
            <div className="flex items-center justify-between">
              <span className="text-[15px] font-bold text-[#2c3e50]">置顶显示</span>
              <Form.Item className="!mb-0" name="isPinned" valuePropName="checked">
                <Switch />
              </Form.Item>
            </div>
          </div>
        </Form>

        {(mutation.error instanceof ApiNotFoundError || listQuery.error instanceof ApiNotFoundError) ? (
          <ApiUnavailable title="公告接口暂不可用，请稍后重试" />
        ) : null}
      </div>

      <div className="fixed bottom-6 left-1/2 z-30 w-[min(350px,calc(100%-34px))] -translate-x-1/2 rounded-3xl border border-white/40 bg-white/85 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.1)] backdrop-blur-xl">
        <Button
          className="!h-12 !w-full !rounded-2xl !border-none !bg-[#f1f1f1] !text-[15px] !font-black !text-[#111827]"
          loading={mutation.isPending}
          onClick={() => submit('published')}
          type="text"
        >
          立即发布公告
        </Button>
      </div>
    </div>
  )
}
