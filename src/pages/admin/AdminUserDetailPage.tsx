import {
  ArrowLeftOutlined,
  EllipsisOutlined,
  IdcardOutlined,
  SafetyOutlined,
  UserDeleteOutlined,
  UserSwitchOutlined,
} from '@ant-design/icons'
import { useMutation, useQuery } from '@tanstack/react-query'
import { Button, message } from 'antd'
import { useNavigate, useParams } from 'react-router-dom'

import { banAdminUser, getAdminUserDetail } from '@/api/endpoints/admin'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asNumber, asRecord, asString } from '@/utils/format'

type UserDetail = {
  id: string
  name: string
  level: number
  department: string
  grade: string
  studentNo: string
  createdAt: string
  role: string
  feedCount: number
  reportCount: number
  likeCount: number
}

const fallbackDetail: UserDetail = {
  id: '1',
  name: '爱吃鱼的猫',
  level: 3,
  department: '软件学院',
  grade: '2022级本科生',
  studentNo: '202200301234',
  createdAt: '2024-03-15',
  role: '普通用户',
  feedCount: 32,
  reportCount: 5,
  likeCount: 128,
}

function normalizeUserDetail(payload: unknown, id: string): UserDetail {
  const row = asRecord(payload)

  return {
    id,
    name: asString(row.name || row.nickname, fallbackDetail.name),
    level: asNumber(row.level, fallbackDetail.level),
    department: asString(row.department || row.college, fallbackDetail.department),
    grade: asString(row.grade, fallbackDetail.grade),
    studentNo: asString(row.studentNo || row.no, fallbackDetail.studentNo),
    createdAt: asString(row.createdAt || row.registerTime, fallbackDetail.createdAt),
    role: asString(row.roleName || row.role, fallbackDetail.role),
    feedCount: asNumber(row.feedCount, fallbackDetail.feedCount),
    reportCount: asNumber(row.reportCount, fallbackDetail.reportCount),
    likeCount: asNumber(row.likeCount, fallbackDetail.likeCount),
  }
}

export function AdminUserDetailPage() {
  usePageTitle('用户详细档案')
  const navigate = useNavigate()
  const { id = '1' } = useParams()

  const query = useQuery({ queryKey: ['admin-user', id], queryFn: () => getAdminUserDetail(id) })
  const detail = query.data?.data ? normalizeUserDetail(query.data.data, id) : fallbackDetail

  const disableMutation = useMutation({
    mutationFn: () => banAdminUser(id, { action: 'BAN', reason: 'manual review' }),
    onSuccess: () => {
      message.success('账号状态已更新')
      query.refetch()
    },
    onError: (error) => message.error(error instanceof Error ? error.message : '操作失败，请稍后再试'),
  })

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-10">
      <section className="mb-3 rounded-b-[24px] bg-white px-5 pb-5 pt-5 shadow-[0_2px_15px_rgba(0,0,0,0.04)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              className="!h-10 !w-10 !border-none !bg-[#f5f5f5] !text-[#7f8c8d]"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate(-1)}
              shape="circle"
              type="text"
            />
            <h1 className="text-[22px] font-extrabold text-[#2c3e50]">用户详细档案</h1>
          </div>
          <button className="text-lg text-[#94a3b8]" type="button">
            <EllipsisOutlined />
          </button>
        </div>
      </section>

      <div className="h5-content pt-0">
        <QueryState error={query.error} isLoading={query.isLoading}>
          <div className="mb-4 rounded-[24px] border border-black/[0.02] bg-white px-5 pb-6 pt-7 text-center shadow-[0_4px_15px_rgba(0,0,0,0.01)]">
            <div className="mx-auto mb-4 h-[100px] w-[100px] rounded-full border-4 border-[#f8fafc] bg-gradient-to-br from-[#d1d5db] to-[#94a3b8] shadow-[0_10px_25px_rgba(0,0,0,0.05)]" />

            <div className="mb-1 flex items-center justify-center gap-2">
              <h2 className="text-[24px] font-black text-[#2c3e50]">{detail.name}</h2>
              <span className="rounded-lg bg-[#fff8e1] px-2 py-1 text-[11px] font-bold text-[#ffa000]">Lv.{detail.level}</span>
            </div>
            <p className="text-[13px] text-[#94a3b8]">
              {detail.department} · {detail.grade}
            </p>

            <div className="mt-7 grid grid-cols-3 gap-3 px-2">
              {[
                [detail.feedCount, '提供投喂'],
                [detail.reportCount, '发现猫咪'],
                [detail.likeCount, '获赞总数'],
              ].map(([value, label]) => (
                <div key={String(label)} className="text-center">
                  <span className="block text-[20px] font-extrabold text-[#2c3e50]">{value}</span>
                  <span className="mt-1 block text-[11px] text-[#7f8c8d]">{label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-4 rounded-[24px] border border-black/[0.02] bg-white p-5 shadow-[0_4px_15px_rgba(0,0,0,0.01)]">
            <h3 className="mb-3 flex items-center gap-2 text-[15px] font-extrabold text-[#2c3e50]">
              <IdcardOutlined className="text-[#ffd54f]" />
              账号基本信息
            </h3>

            <div className="divide-y divide-[#f1f5f9]">
              <div className="flex items-center justify-between py-3 text-[14px]">
                <span className="text-[#7f8c8d]">学号 / 工号</span>
                <span className="font-bold text-[#2c3e50]">{detail.studentNo}</span>
              </div>
              <div className="flex items-center justify-between py-3 text-[14px]">
                <span className="text-[#7f8c8d]">注册时间</span>
                <span className="font-bold text-[#2c3e50]">{detail.createdAt}</span>
              </div>
              <div className="flex items-center justify-between py-3 text-[14px]">
                <span className="text-[#7f8c8d]">账号权限</span>
                <span className="font-bold text-[#2c3e50]">{detail.role}</span>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-black/[0.02] bg-white p-5 shadow-[0_4px_15px_rgba(0,0,0,0.01)]">
            <h3 className="mb-3 flex items-center gap-2 text-[15px] font-extrabold text-[#2c3e50]">
              <SafetyOutlined className="text-[#ffd54f]" />
              管理员操作
            </h3>

            <button
              className="mb-3 flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#f1f5f9] text-[14px] font-bold text-[#475569]"
              onClick={() => message.success('已发送管理员权限申请通知')}
              type="button"
            >
              <UserSwitchOutlined />
              提升为管理员权限
            </button>

            <button
              className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl border border-[#fecdd3] bg-[#fff1f2] text-[14px] font-bold text-[#e11d48]"
              onClick={() => disableMutation.mutate()}
              type="button"
            >
              <UserDeleteOutlined />
              {disableMutation.isPending ? '处理中...' : '禁用此账号（封禁）'}
            </button>
          </div>
        </QueryState>
      </div>
    </div>
  )
}
