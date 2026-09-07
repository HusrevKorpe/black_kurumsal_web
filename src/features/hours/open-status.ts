import { addDays, addDaysToKey, parseHm, previousDay, zonedNow } from './time'
import {
  ISTANBUL_TZ,
  type DayOfWeek,
  type DaySchedule,
  type HoursEntry,
  type HoursExceptionEntry,
  type OpenStatus,
  type WeeklyHours,
} from './types'

interface Span {
  opens: number
  closes: number
}

const CLOSED: DaySchedule = { isClosed: true, opensAt: null, closesAt: null }

function spanOf(entry: DaySchedule): Span | null {
  if (entry.isClosed || !entry.opensAt || !entry.closesAt) return null
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

/** O günün geçerli saati: istisna varsa haftalık tabloyu tamamen ezer. */
function scheduleFor(
  dayOfWeek: DayOfWeek,
  dateKey: string,
  byDay: ReadonlyMap<DayOfWeek, HoursEntry>,
  byDate: ReadonlyMap<string, HoursExceptionEntry>,
): DaySchedule {
  return byDate.get(dateKey) ?? byDay.get(dayOfWeek) ?? CLOSED
}

export interface OpenStatusOptions {
  now?: Date
  timeZone?: string
  /** Haftalık tabloyu ezen günler. Geçmiş tarihler zararsızdır: eşleşmezler. */
  exceptions?: readonly HoursExceptionEntry[]
}

/**
 * Verilen anda açık mı? Dünün gece yarısını geçen vardiyası da hesaba katılır
 * (PlayStation 10:00–02:00 ise saat 01:00'de hâlâ açıktır). İstisna günler haftalık tabloyu ezer.
 */
export function getOpenStatus(week: WeeklyHours, options: OpenStatusOptions = {}): OpenStatus {
  const { now = new Date(), timeZone = ISTANBUL_TZ, exceptions = [] } = options
  if (week.length === 0) return { kind: 'unknown' }

  const { dayOfWeek, minutes, dateKey } = zonedNow(now, timeZone)
  const byDay = new Map(week.map((e) => [e.dayOfWeek, e]))
  const byDate = new Map(exceptions.map((e) => [e.date, e]))

  const yesterday = scheduleFor(previousDay(dayOfWeek), addDaysToKey(dateKey, -1), byDay, byDate)
  const yesterdaySpan = spanOf(yesterday)
  if (yesterdaySpan && isOvernight(yesterdaySpan) && minutes < yesterdaySpan.closes) {
    return { kind: 'open', closesAt: yesterday.closesAt }
  }

  const today = scheduleFor(dayOfWeek, dateKey, byDay, byDate)
  const todaySpan = spanOf(today)
  if (todaySpan) {
    if (isAllDay(todaySpan)) return { kind: 'open', closesAt: null }
    const openNow = isOvernight(todaySpan)
      ? minutes >= todaySpan.opens
      : minutes >= todaySpan.opens && minutes < todaySpan.closes
    if (openNow) return { kind: 'open', closesAt: today.closesAt }
  }

  return { kind: 'closed', nextOpen: findNextOpen(byDay, byDate, dayOfWeek, dateKey, minutes) }
}

function findNextOpen(
  byDay: ReadonlyMap<DayOfWeek, HoursEntry>,
  byDate: ReadonlyMap<string, HoursExceptionEntry>,
  dayOfWeek: DayOfWeek,
  dateKey: string,
  minutes: number,
): { dayOfWeek: DayOfWeek; opensAt: string } | null {
  for (let offset = 0; offset < 7; offset += 1) {
    const day = addDays(dayOfWeek, offset)
    const schedule = scheduleFor(day, addDaysToKey(dateKey, offset), byDay, byDate)
    const span = spanOf(schedule)
    if (!span || !schedule.opensAt) continue
    if (offset === 0 && span.opens <= minutes) continue
    return { dayOfWeek: day, opensAt: schedule.opensAt }
  }
  return null
}
