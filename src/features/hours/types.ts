export type DayOfWeek = 1 | 2 | 3 | 4 | 5 | 6 | 7

export const DAYS_OF_WEEK: readonly DayOfWeek[] = [1, 2, 3, 4, 5, 6, 7]

/** Bir günün çalışma saati. isClosed ise saatler yok sayılır. */
export interface HoursEntry {
  dayOfWeek: DayOfWeek
  opensAt: string | null
  closesAt: string | null
  isClosed: boolean
}

/** Veritabanından gelen ham satır: dayOfWeek henüz doğrulanmamış sayı. */
export interface HoursInput {
  dayOfWeek: number
  opensAt: string | null
  closesAt: string | null
  isClosed: boolean
}

/** 7 günün tamamı, gün sırasına göre. */
export type WeeklyHours = readonly HoursEntry[]

export type HoursSource = 'shop' | 'location' | 'none'

export interface ResolvedHours {
  source: HoursSource
  week: WeeklyHours
}

export type OpenStatus =
  | { kind: 'open'; closesAt: string | null }
  | { kind: 'closed'; nextOpen: { dayOfWeek: DayOfWeek; opensAt: string } | null }
  | { kind: 'unknown' }

export const ISTANBUL_TZ = 'Europe/Istanbul'
