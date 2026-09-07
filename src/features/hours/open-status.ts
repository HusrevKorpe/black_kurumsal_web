import { addDays, parseHm, previousDay, zonedNow } from './time'
import { ISTANBUL_TZ, type HoursEntry, type OpenStatus, type WeeklyHours } from './types'

interface Span {
  opens: number
  closes: number
}

function spanOf(entry: HoursEntry | undefined): Span | null {
  if (!entry || entry.isClosed || !entry.opensAt || !entry.closesAt) return null
  const opens = parseHm(entry.opensAt)
  const closes = parseHm(entry.closesAt)
  if (opens === null || closes === null) return null
  return { opens, closes }
}

/** Kapanış açılıştan küçükse gece yarısını geçer. Eşitse 24 saat açık sayılır. */
export function isOvernight(span: Span): boolean {
  return span.closes < span.opens
}

export function isAllDay(span: Span): boolean {
  return span.closes === span.opens
}

/**
 * Verilen anda açık mı? Dünün gece yarısını geçen vardiyası da hesaba katılır
 * (PlayStation 10:00–02:00 ise saat 01:00'de hâlâ açıktır).
 */
export function getOpenStatus(
  week: WeeklyHours,
  now: Date = new Date(),
  timeZone: string = ISTANBUL_TZ,
): OpenStatus {
  if (week.length === 0) return { kind: 'unknown' }

  const { dayOfWeek, minutes } = zonedNow(now, timeZone)
  const byDay = new Map(week.map((e) => [e.dayOfWeek, e]))

  const yesterday = spanOf(byDay.get(previousDay(dayOfWeek)))
  if (yesterday && isOvernight(yesterday) && minutes < yesterday.closes) {
    return { kind: 'open', closesAt: byDay.get(previousDay(dayOfWeek))?.closesAt ?? null }
  }

  const todayEntry = byDay.get(dayOfWeek)
  const today = spanOf(todayEntry)
  if (today) {
    if (isAllDay(today)) return { kind: 'open', closesAt: null }
    const openNow = isOvernight(today)
      ? minutes >= today.opens
      : minutes >= today.opens && minutes < today.closes
    if (openNow) return { kind: 'open', closesAt: todayEntry?.closesAt ?? null }
  }

  return { kind: 'closed', nextOpen: findNextOpen(byDay, dayOfWeek, minutes) }
}

function findNextOpen(
  byDay: Map<number, HoursEntry>,
  dayOfWeek: HoursEntry['dayOfWeek'],
  minutes: number,
): { dayOfWeek: HoursEntry['dayOfWeek']; opensAt: string } | null {
  for (let offset = 0; offset < 7; offset += 1) {
    const day = addDays(dayOfWeek, offset)
    const entry = byDay.get(day)
    const span = spanOf(entry)
    if (!span || !entry?.opensAt) continue
    if (offset === 0 && span.opens <= minutes) continue
    return { dayOfWeek: day, opensAt: entry.opensAt }
  }
  return null
}
