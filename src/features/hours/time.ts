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

/** Verilen anın, verilen saat dilimindeki haftanın günü ve dakikası. */
export function zonedNow(date: Date, timeZone: string): { dayOfWeek: DayOfWeek; minutes: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date)

  const pick = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value
  const dayOfWeek = WEEKDAY_MAP[pick('weekday') ?? '']
  const hour = Number(pick('hour'))
  const minute = Number(pick('minute'))

  if (!dayOfWeek || Number.isNaN(hour) || Number.isNaN(minute)) {
    throw new Error(`Saat dilimi çözümlenemedi: ${timeZone}`)
  }
  return { dayOfWeek, minutes: (hour % 24) * 60 + minute }
}

export function previousDay(day: DayOfWeek): DayOfWeek {
  return (day === 1 ? 7 : day - 1) as DayOfWeek
}

export function addDays(day: DayOfWeek, offset: number): DayOfWeek {
  return (((((day - 1 + offset) % 7) + 7) % 7) + 1) as DayOfWeek
}
