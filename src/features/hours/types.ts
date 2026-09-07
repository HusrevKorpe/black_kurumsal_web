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

/**
 * Haftalık tabloyu ezen tek gün. `date` saat dilimsiz takvim günüdür: "YYYY-MM-DD" (Europe/Istanbul).
 * Kapalıysa saatler yok sayılır; açıksa ikisi de dolu olur.
 */
export interface HoursExceptionEntry {
  date: string
  isClosed: boolean
  opensAt: string | null
  closesAt: string | null
  note: string | null
}

/** Veritabanından gelen ham istisna satırı: date, @db.Date olduğu için UTC gece yarısıdır. */
export interface HoursExceptionInput {
  id: string
  date: Date
  isClosed: boolean
  opensAt: string | null
  closesAt: string | null
  note: string | null
}

/** Bir günün açık/kapalı bilgisi; haftalık kayıt da istisna da bu şekli sağlar. */
export interface DaySchedule {
  isClosed: boolean
  opensAt: string | null
  closesAt: string | null
}

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
