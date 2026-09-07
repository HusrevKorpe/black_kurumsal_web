import { addDaysToKey, zonedNow } from '@/features/hours/time'

export const TIME_ZONE = 'Europe/Istanbul'
/** Panelde seçilebilen aralıklar (gün). */
export const RANGE_OPTIONS = [7, 30, 90] as const
export type RangeDays = (typeof RANGE_OPTIONS)[number]
export const DEFAULT_RANGE: RangeDays = 30

export function parseRange(value: string | string[] | undefined): RangeDays {
  const raw = Number(Array.isArray(value) ? value[0] : value)
  return (RANGE_OPTIONS as readonly number[]).includes(raw) ? (raw as RangeDays) : DEFAULT_RANGE
}

/** Bir anın verilen saat dilimindeki UTC farkı (ms). Yaz saati uygulanırsa kendiliğinden değişir. */
function zoneOffsetMs(date: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value)
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour') % 24,
    get('minute'),
    get('second'),
  )
  return asUtc - date.getTime()
}

/** "YYYY-MM-DD" gününün o saat dilimindeki gece yarısı, gerçek (UTC) an olarak. */
export function zonedDayStart(dateKey: string, timeZone = TIME_ZONE): Date {
  const naive = new Date(`${dateKey}T00:00:00.000Z`)
  return new Date(naive.getTime() - zoneOffsetMs(naive, timeZone))
}

export interface DateRange {
  days: RangeDays
  /** Aralığın ilk günü dahil: bugün dahil `days` gün geriye gidilir. */
  from: Date
  /** İstanbul takvimine göre gün anahtarları, eskiden yeniye. Boş günler grafikte 0 olarak durur. */
  dayKeys: string[]
}

export function buildRange(now: Date, days: RangeDays): DateRange {
  const today = zonedNow(now, TIME_ZONE).dateKey
  const firstKey = addDaysToKey(today, -(days - 1))
  const dayKeys = Array.from({ length: days }, (_, index) => addDaysToKey(firstKey, index))
  return { days, from: zonedDayStart(firstKey), dayKeys }
}
