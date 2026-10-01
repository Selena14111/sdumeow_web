import { asRecord, asString, toPaged } from '@/utils/format'

const ANNOUNCEMENT_LAST_SEEN_AT_KEY = 'sdu_meow_announcements_last_seen_at'

function normalizeTimestamp(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0
  return value < 1_000_000_000_000 ? Math.floor(value * 1000) : Math.floor(value)
}

function parseAnnouncementTimestamp(value: unknown): number {
  if (typeof value === 'number') return normalizeTimestamp(value)

  const text = asString(value).trim()
  if (!text) return 0

  const numeric = Number(text)
  if (Number.isFinite(numeric)) return normalizeTimestamp(numeric)

  const normalizedText = text.includes('T') ? text : text.replace(' ', 'T')
  const parsed = Date.parse(normalizedText)
  return Number.isFinite(parsed) ? parsed : 0
}

function unwrapAnnouncement(value: unknown): Record<string, unknown> {
  const row = asRecord(value)
  const nested = asRecord(row.announcement || row.notice || row.detail)
  return Object.keys(nested).length ? nested : row
}

function getAnnouncementRows(payload: unknown): Record<string, unknown>[] {
  const rawItems = Array.isArray(payload) ? payload : toPaged<Record<string, unknown>>(payload).items
  return rawItems.map(unwrapAnnouncement)
}

function isDeletedAnnouncement(row: Record<string, unknown>): boolean {
  const status = asString(row.status || row.state).toUpperCase()
  return status.includes('DELETE') || status.includes('REMOVED') || row.deleted === true || row.isDeleted === true
}

function getAnnouncementPublishedAt(row: Record<string, unknown>): number {
  return Math.max(
    parseAnnouncementTimestamp(row.publishTime),
    parseAnnouncementTimestamp(row.publishDate),
    parseAnnouncementTimestamp(row.createdAt),
    parseAnnouncementTimestamp(row.createTime),
    parseAnnouncementTimestamp(row.updatedAt),
  )
}

export function readAnnouncementSeenAt(): number {
  try {
    const value = Number(window.localStorage.getItem(ANNOUNCEMENT_LAST_SEEN_AT_KEY))
    return Number.isFinite(value) && value >= 0 ? value : 0
  } catch {
    return 0
  }
}

export function markAnnouncementsSeen(seenAt = Date.now()) {
  try {
    window.localStorage.setItem(ANNOUNCEMENT_LAST_SEEN_AT_KEY, String(normalizeTimestamp(seenAt)))
  } catch {
    // Ignore storage failures; the badge can still render from server data.
  }
}

export function getNewAnnouncementCount(payload: unknown, seenAt = readAnnouncementSeenAt()): number {
  return getAnnouncementRows(payload).reduce((count, row) => {
    if (isDeletedAnnouncement(row)) return count
    return getAnnouncementPublishedAt(row) > seenAt ? count + 1 : count
  }, 0)
}
