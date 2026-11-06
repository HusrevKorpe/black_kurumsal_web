/**
 * Takvimin saf hesapları. Gün anahtarı İstanbul saatine göre "YYYY-MM-DD": sunucu UTC'de,
 * ziyaretçi başka saat diliminde olsa da gece 01:00'deki turnuva doğru güne düşer.
 */

export const CALENDAR_TIME_ZONE = 'Europe/Istanbul'

const keyFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: CALENDAR_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export type DayKey = `${number}-${string}-${string}`

export function dayKey(date: Date): DayKey {
  return keyFormatter.format(date) as DayKey
}

export interface MonthRef {
  year: number
  /** 1–12 */
  month: number
}

export function monthOf(date: Date): MonthRef {
  const [y, m] = dayKey(date).split('-')
  return { year: Number(y), month: Number(m) }
}

export function addMonths(ref: MonthRef, delta: number): MonthRef {
  const index = ref.year * 12 + (ref.month - 1) + delta
  return { year: Math.floor(index / 12), month: (index % 12) + 1 }
}

const pad = (n: number) => String(n).padStart(2, '0')

function keyOfUtc(d: Date): DayKey {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}` as DayKey
}

export interface CalendarCell {
  key: DayKey
  day: number
  inMonth: boolean
  /** 0 = Pazartesi … 6 = Pazar */
  weekday: number
}

/** Pazartesiyle başlayan tam haftalar; ayın dışındaki günler inMonth=false. */
export function monthGrid({ year, month }: MonthRef): CalendarCell[] {
  const first = new Date(Date.UTC(year, month - 1, 1))
  const lead = (first.getUTCDay() + 6) % 7
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const total = Math.ceil((lead + daysInMonth) / 7) * 7
  return Array.from({ length: total }, (_, i) => {
    const d = new Date(Date.UTC(year, month - 1, 1 - lead + i))
    return {
      key: keyOfUtc(d),
      day: d.getUTCDate(),
      inMonth: d.getUTCMonth() === month - 1,
      weekday: i % 7,
    }
  })
}

/** Etkinliğin kapladığı günler (en fazla 31; uzun süreli kayıt takvimi doldurmasın). */
export function eventDayKeys(startsAt: Date, endsAt: Date | null): DayKey[] {
  const start = dayKey(startsAt)
  const end = endsAt ? dayKey(endsAt) : start
  const keys: DayKey[] = [start]
  const cursor = new Date(`${start}T00:00:00Z`)
  while (keys.length < 31) {
    cursor.setUTCDate(cursor.getUTCDate() + 1)
    const key = keyOfUtc(cursor)
    if (key > end) break
    keys.push(key)
  }
  return keys
}

/** Gün anahtarı → o günün etkinlikleri (başlangıç sırasıyla). */
export function groupByDay<T extends { startsAt: string; endsAt: string | null }>(
  events: readonly T[],
): Map<DayKey, T[]> {
  const map = new Map<DayKey, T[]>()
  const sorted = [...events].sort((a, b) => a.startsAt.localeCompare(b.startsAt))
  for (const event of sorted) {
    const keys = eventDayKeys(
      new Date(event.startsAt),
      event.endsAt ? new Date(event.endsAt) : null,
    )
    for (const key of keys) {
      const list = map.get(key)
      if (list) list.push(event)
      else map.set(key, [event])
    }
  }
  return map
}
