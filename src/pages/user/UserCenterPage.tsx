import { ArrowLeftOutlined } from '@ant-design/icons'
import { useQueries, useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { getMyAdoptions } from '@/api/endpoints/adoptions'
import { getCatDetail } from '@/api/endpoints/cats'
import { getMe } from '@/api/endpoints/user'
import { QueryState } from '@/components/feedback/QueryState'
import { usePageTitle } from '@/hooks/usePageTitle'
import { asNumber, asRecord, asString, formatTimestampText, toPaged } from '@/utils/format'

type StatusKey = 'pending' | 'interview' | 'approved' | 'rejected'

type ApplicationRecord = {
  id: string
  catId: string
  catName: string
  catAvatar: string
  campus: string
  createdAt: string
  status: StatusKey
  type: string
  progress: string
}

const statusLabel: Record<StatusKey, string> = {
  pending: '待处理',
  interview: '待面谈',
  approved: '通过',
  rejected: '拒绝',
}

const statusOptions: Array<{ key: StatusKey; apiStatus: string; color: string }> = [
  { key: 'pending', apiStatus: 'PENDING', color: 'pending' },
  { key: 'interview', apiStatus: 'INTERVIEW', color: 'interview' },
  { key: 'approved', apiStatus: 'APPROVED', color: 'approved' },
  { key: 'rejected', apiStatus: 'REJECTED', color: 'rejected' },
]

const campusCodeLabelMap: Record<string, string> = {
  '0': '中心校区',
  '1': '趵突泉校区',
  '2': '洪家楼校区',
  '3': '千佛山校区',
  '4': '兴隆山校区',
  '5': '软件园校区',
  '6': '青岛校区',
  '7': '威海校区',
}

const campusEnumToLabelMap: Record<string, string> = {
  CENTRAL: '中心校区',
  BAOTUQUAN: '趵突泉校区',
  HONGJIALOU: '洪家楼校区',
  QIANFOSHAN: '千佛山校区',
  XINGLONGSHAN: '兴隆山校区',
  SOFTWARE_PARK: '软件园校区',
  QINGDAO: '青岛校区',
  WEIHAI: '威海校区',
}

function firstPresent(...values: unknown[]): unknown {
  return values.find((value) => {
    if (value === null || value === undefined) return false
    return typeof value !== 'string' || value.trim().length > 0
  })
}

function normalizeCampus(value: unknown): string {
  const record = asRecord(value)
  if (Object.keys(record).length > 0) {
    return normalizeCampus(firstPresent(record.campusName, record.campusLabel, record.label, record.name, record.title, record.campus, record.code, record.id, record.value))
  }

  const text = typeof value === 'number' ? String(value) : asString(value).trim()
  if (!text) return '未知校区'
  return campusCodeLabelMap[text] ?? campusEnumToLabelMap[text.toUpperCase()] ?? text
}

function asText(value: unknown, fallback = ''): string {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  if (typeof value === 'string' && value.trim()) return value
  return fallback
}

function normalizeApplicationStatus(value: unknown, fallbackStatus: StatusKey): StatusKey {
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value === 1) return 'interview'
    if (value === 2) return 'approved'
    if (value === 3) return 'rejected'
    return 'pending'
  }

  const status = asString(value).trim().toUpperCase()
  if (status.includes('INTERVIEW') || status.includes('MEETING') || status.includes('面谈')) return 'interview'
  if (status.includes('APPROV') || status.includes('PASS') || status.includes('COMPLETED') || status.includes('通过')) return 'approved'
  if (status.includes('REJECT') || status.includes('REFUSE') || status.includes('DENY') || status.includes('拒绝') || status.includes('驳回')) {
    return 'rejected'
  }
  if (status.includes('PENDING') || status.includes('PROCESS') || status.includes('待处理') || status.includes('待审核')) return 'pending'
  return fallbackStatus
}

function normalizeRecord(item: unknown, index: number, fallbackStatus: StatusKey): ApplicationRecord {
  const row = asRecord(item)
  const cat = asRecord(row.cat)
  const catInfo = asRecord(row.catInfo)
  const basicInfo = asRecord(firstPresent(row.basicInfo, row.catBasicInfo, cat.basicInfo, catInfo.basicInfo))
  const status = normalizeApplicationStatus(row.status, fallbackStatus)

  return {
    id: asText(row.id ?? row.adoptionId ?? row.applicationId, String(index + 1)),
    catId: asText(firstPresent(row.catId, row.cat_id, cat.id, catInfo.id), ''),
    catAvatar: asString(row.catAvatar || row.cat_avatar || cat.avatar || catInfo.avatar, ''),
    catName: asString(row.catName || row.cat_name || cat.name || catInfo.name, `猫咪${index + 1}`),
    campus: normalizeCampus(firstPresent(row.catCampus, row.catCampusName, row.campusName, row.campus, cat.campusName, cat.campus, catInfo.campusName, catInfo.campus, basicInfo.campusName, basicInfo.campus)),
    createdAt: formatTimestampText(row.createTime || row.createdAt || row.created_at, '--'),
    status,
    type: asString(row.type, '领养申请'),
    progress: asString(row.reason || row.progress, statusLabel[status]),
  }
}

const AUTO_CHECKIN_TOTAL_DAYS_STORAGE_KEY = 'user:auto-checkin:total-days'

function readStoredCheckinTotalDays(): number | null {
  const raw = window.localStorage.getItem(AUTO_CHECKIN_TOTAL_DAYS_STORAGE_KEY)
  if (!raw) return null
  const value = Number(raw)
  if (!Number.isFinite(value) || value < 0) return null
  return Math.floor(value)
}

export function UserCenterPage() {
  usePageTitle('我的申请')
  const navigate = useNavigate()
  const [active, setActive] = useState<StatusKey>('pending')
  const checkinTotalDays = readStoredCheckinTotalDays()
  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
  })

  const adoptionQueries = useQueries({
    queries: statusOptions.map((option) => ({
      queryKey: ['my-adoptions', option.apiStatus],
      queryFn: () =>
        getMyAdoptions({
          status: option.apiStatus,
          page: 1,
          size: 100,
        }),
    })),
  })

  const meProfile = asRecord(meQuery.data?.data)
  const currency = Math.max(0, asNumber(meProfile.currency, 0))
  const exp = Math.max(0, asNumber(meProfile.exp, 0))
  const nextExp = Math.max(0, asNumber(meProfile.nextExp, 0))
  const expToNextLevel = Math.max(0, nextExp - exp)
  const meStats = asRecord(meProfile.stats)
  const checkinDaysFromProfile = asNumber(meStats.totalDays, asNumber(meStats.checkinDays, asNumber(meStats.checkinCount, -1)))
  const checkinDays = checkinTotalDays ?? (checkinDaysFromProfile >= 0 ? Math.floor(checkinDaysFromProfile) : 0)

  const baseRecordsByStatus = useMemo(() => {
    return statusOptions.reduce(
      (result, option, index) => {
        const rawItems = toPaged<Record<string, unknown>>(adoptionQueries[index]?.data?.data).items
        result[option.key] = rawItems.map((item, itemIndex) => normalizeRecord(item, itemIndex, option.key))
        return result
      },
      {
        pending: [],
        interview: [],
        approved: [],
        rejected: [],
      } as Record<StatusKey, ApplicationRecord[]>,
    )
  }, [adoptionQueries])

  const campusLookupCatIds = useMemo(() => {
    const catIds = new Set<string>()

    Object.values(baseRecordsByStatus).forEach((items) => {
      items.forEach((item) => {
        if (item.campus === '未知校区' && item.catId) {
          catIds.add(item.catId)
        }
      })
    })

    return Array.from(catIds)
  }, [baseRecordsByStatus])

  const campusQueries = useQueries({
    queries: campusLookupCatIds.map((catId) => ({
      queryKey: ['cat-detail', catId],
      queryFn: () => getCatDetail(catId),
      enabled: Boolean(catId),
    })),
  })

  const campusByCatId = useMemo(() => {
    return campusLookupCatIds.reduce(
      (result, catId, index) => {
        const catRecord = asRecord(campusQueries[index]?.data?.data)
        const catBasicInfo = asRecord(catRecord.basicInfo)
        const campus = normalizeCampus(firstPresent(catRecord.campus, catBasicInfo.campus, catRecord.campusName, catBasicInfo.campusName))

        if (campus && campus !== '未知校区') {
          result[catId] = campus
        }

        return result
      },
      {} as Record<string, string>,
    )
  }, [campusLookupCatIds, campusQueries])

  const recordsByStatus = useMemo(() => {
    const resolveCampus = (item: ApplicationRecord) => {
      if (item.campus !== '未知校区') return item.campus
      if (!item.catId) return item.campus
      return campusByCatId[item.catId] ?? item.campus
    }

    return statusOptions.reduce(
      (result, option) => {
        result[option.key] = baseRecordsByStatus[option.key].map((item) => ({
          ...item,
          campus: resolveCampus(item),
        }))
        return result
      },
      {
        pending: [],
        interview: [],
        approved: [],
        rejected: [],
      } as Record<StatusKey, ApplicationRecord[]>,
    )
  }, [baseRecordsByStatus, campusByCatId])

  const summary = useMemo(() => {
    return statusOptions.reduce(
      (result, option, index) => {
        const page = toPaged<Record<string, unknown>>(adoptionQueries[index]?.data?.data)
        result[option.key] = page.total || baseRecordsByStatus[option.key].length
        return result
      },
      {
        pending: 0,
        interview: 0,
        approved: 0,
        rejected: 0,
      } as Record<StatusKey, number>,
    )
  }, [adoptionQueries, baseRecordsByStatus])

  const activeIndex = statusOptions.findIndex((option) => option.key === active)
  const activeQuery = adoptionQueries[activeIndex]
  const filtered = recordsByStatus[active]

  return (
    <div className="h5-content pb-6">
      <div className="mb-5 flex items-center gap-3">
        <button className="top-icon-btn !rounded-xl" onClick={() => navigate(-1)} type="button">
          <ArrowLeftOutlined />
        </button>
        <h1 className="text-[22px] font-bold">我的申请</h1>
      </div>

      <div className="mb-5 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-[#fff8e1] px-3 py-3 shadow-[0_8px_16px_rgba(0,0,0,0.06)]">
          <p className="text-[11px] text-[#999]">小鱼干</p>
          <p className="text-[24px] font-bold text-[#f57f17]">{currency}</p>
        </div>
        <div className="rounded-xl bg-[#e8f5e9] px-3 py-3 shadow-[0_8px_16px_rgba(0,0,0,0.06)]">
          <p className="text-[11px] text-[#999]">累计签到</p>
          <p className="text-[24px] font-bold text-[#2e7d32]">{checkinDays}</p>
        </div>
        <div className="rounded-xl bg-[#e3f2fd] px-3 py-3 shadow-[0_8px_16px_rgba(0,0,0,0.06)]">
          <p className="text-[11px] text-[#999]">当前经验</p>
          <p className="text-[20px] font-bold text-[#1565c0]">{exp}</p>
        </div>
        <div className="rounded-xl bg-[#f3e5f5] px-3 py-3 shadow-[0_8px_16px_rgba(0,0,0,0.06)]">
          <p className="text-[11px] text-[#999]">距下一级</p>
          <p className="text-[20px] font-bold text-[#6a1b9a]">{expToNextLevel}</p>
        </div>
      </div>

      <div className="mb-5 grid grid-cols-4 gap-2">
        {statusOptions.map((option) => (
          <div key={option.key} className="rounded-xl bg-white px-2 py-3 text-center shadow-[0_8px_16px_rgba(0,0,0,0.06)]">
            <p
              className={clsx(
                'text-[22px] font-bold',
                option.color === 'pending' && 'text-[#ffa726]',
                option.color === 'interview' && 'text-[#42a5f5]',
                option.color === 'approved' && 'text-[#66bb6a]',
                option.color === 'rejected' && 'text-[#ef5350]',
              )}
            >
              {summary[option.key]}
            </p>
            <p className="text-[11px] text-[#999]">{statusLabel[option.key]}</p>
          </div>
        ))}
      </div>

      <div className="chip-row mb-4">
        {statusOptions.map((option) => (
          <button
            key={option.key}
            className={clsx(
              'rounded-full border px-4 py-2 text-[12px] font-semibold transition',
              active === option.key ? 'border-[#1a1a1a] bg-[#1a1a1a] text-white' : 'border-[#eee] bg-white text-[#666]',
            )}
            onClick={() => setActive(option.key)}
            type="button"
          >
            {statusLabel[option.key]}
          </button>
        ))}
      </div>

      <QueryState
        error={activeQuery?.error}
        isEmpty={!activeQuery?.isLoading && !activeQuery?.error && !filtered.length}
        isLoading={activeQuery?.isLoading}
        emptyDescription={`暂无${statusLabel[active]}申请`}
      >
        <div className="space-y-3">
          {filtered.map((item) => (
            <div key={item.id} className="rounded-2xl bg-white p-4 shadow-[0_8px_18px_rgba(0,0,0,0.06)]">
              <div className="mb-2 flex items-start justify-between">
                <div className="flex gap-2">
                  <div className="h-12 w-12 overflow-hidden rounded-xl bg-gradient-to-br from-[#d1d5db] to-[#94a3b8]">
                    {item.catAvatar ? <img alt={item.catName} className="h-full w-full object-cover" src={item.catAvatar} /> : null}
                  </div>
                  <div>
                    <p className="text-[15px] font-bold">{item.catName}</p>
                    <p className="text-[11px] text-[#999]">{`${item.campus} · 申请于 ${item.createdAt}`}</p>
                  </div>
                </div>
                <span
                  className={clsx(
                    'rounded-full px-2 py-1 text-[10px] font-semibold',
                    item.status === 'pending' && 'bg-[#fff3e0] text-[#e65100]',
                    item.status === 'interview' && 'bg-[#e3f2fd] text-[#1565c0]',
                    item.status === 'approved' && 'bg-[#e8f5e9] text-[#2e7d32]',
                    item.status === 'rejected' && 'bg-[#ffebee] text-[#c62828]',
                  )}
                >
                  {statusLabel[item.status]}
                </span>
              </div>

              <div className="border-t border-[#f5f5f5] pt-2 text-[12px] text-[#666]">
                <div className="mb-1 flex justify-between">
                  <span className="text-[#999]">申请类型</span>
                  <span className="font-medium text-[#333]">{item.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#999]">当前进度</span>
                  <span className="font-medium text-[#333]">{item.progress}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </QueryState>
    </div>
  )
}
