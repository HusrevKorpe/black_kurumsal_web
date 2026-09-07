import type { DayOfWeek } from './types'

export const HM_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/

/** "HH:mm" → gece yarısından itibaren dakika. Biçim bozuksa null. */
export function parseHm(value: string): number | null {
  if (!HM_PATTERN.test(value)) return null
  const [h, m] = value.split(':').map(Number) as [number, number]
  return h * 60 + m
}

export function formatHm(minutes: number): string {
  const total = ((minutes % 1440) + 1440) % 1440
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

const WEEKDAY_MAP: Record<string, DayOfWeek> = {
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
  Sun: 7,
}

export const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export interface ZonedNow {
  dayOfWeek: DayOfWeek
  minutes: number
  /** O saat dilimindeki takvim günü: "YYYY-MM-DD". */
  dateKey: string
}

/** Verilen anın, verilen saat dilimindeki haftanın günü, dakikası ve takvim günü. */
export function zonedNow(date: Date, timeZone: string): ZonedNow {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)

  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value
  const dayOfWeek = WEEKDAY_MAP[pick('weekday') ?? '']
  const hour = Number(pick('hour'))
  const minute = Number(pick('minute'))
  const dateKey = `${pick('year')}-${pick('month')}-${pick('day')}`

  if (!dayOfWeek || Number.isNaN(hour) || Number.isNaN(minute) || !DATE_KEY_PATTERN.test(dateKey)) {
    throw new Error(`Saat dilimi çözümlenemedi: ${timeZone}`)
  }
  return { dayOfWeek, minutes: (hour % 24) * 60 + minute, dateKey }
}

/** "YYYY-MM-DD" + gün. UTC üzerinden sayılır; yaz saati uygulaması günü kaydırmaz. */
export function addDaysToKey(dateKey: string, days: number): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

/** Prisma `@db.Date` değeri (UTC gece yarısı) → "YYYY-MM-DD". */
export function dateKeyFromDbDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/** "YYYY-MM-DD" → Prisma `@db.Date` için UTC gece yarısı. Biçim bozuksa null. */
export function dbDateFromKey(dateKey: string): Date | null {
  if (!DATE_KEY_PATTERN.test(dateKey)) return null
  const date = new Date(`${dateKey}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return null
  // 2026-02-31 gibi taşan tarihler Date tarafından kaydırılır; geri yazınca yakalanır.
  return date.toISOString().slice(0, 10) === dateKey ? date : null
}

const DATE_KEY_FORMATTER = new Intl.DateTimeFormat('tr-TR', {
  timeZone: 'UTC',
  day: '2-digit',
  month: 'long',
  weekday: 'long',
})

/** "3 Eylül Perşembe" — istisna günlerin listelenmesi için. */
export function formatDateKey(dateKey: string): string {
  const date = new Date(`${dateKey}T00:00:00.000Z`)
  if (Number.isNaN(date.getTime())) return dateKey
  return DATE_KEY_FORMATTER.format(date)
}

export function previousDay(day: DayOfWeek): DayOfWeek {
  return (day === 1 ? 7 : day - 1) as DayOfWeek
}

export function addDays(day: DayOfWeek, offset: number): DayOfWeek {
  return (((((day - 1 + offset) % 7) + 7) % 7) + 1) as DayOfWeek
}
