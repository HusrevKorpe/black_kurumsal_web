import { addDaysToKey, dateKeyFromDbDate, dbDateFromKey, zonedNow } from './time'
import {
  ISTANBUL_TZ,
  type HoursExceptionEntry,
  type HoursExceptionInput,
  type HoursSource,
} from './types'

/** Ham satırlar → istisna girdileri. Tarih "YYYY-MM-DD" anahtarına çevrilir, sıralanır. */
export function toExceptionEntries(rows: readonly HoursExceptionInput[]): HoursExceptionEntry[] {
  return rows
    .map((row) => ({
      date: dateKeyFromDbDate(row.date),
      isClosed: row.isClosed,
      opensAt: row.isClosed ? null : row.opensAt,
      closesAt: row.isClosed ? null : row.closesAt,
      note: row.note,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** Panel listesi: kaydı silebilmek için kimliği de taşır (sitede gereksiz, gönderilmez). */
export function toAdminExceptionEntries(
  rows: readonly HoursExceptionInput[],
): (HoursExceptionEntry & { id: string })[] {
  return rows
    .map((row) => ({ id: row.id, ...toExceptionEntries([row])[0]! }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Haftalık saatlerle aynı kaynak kuralı: dükkanın kendi saatleri varsa kendi istisnaları geçerlidir,
 * saatleri mekandan devralıyorsa mekanın istisnaları da devralınır. Gün bazında karışım yapılmaz.
 */
export function resolveExceptions(
  source: HoursSource,
  shopExceptions: readonly HoursExceptionEntry[],
  locationExceptions: readonly HoursExceptionEntry[] | null | undefined,
): HoursExceptionEntry[] {
  if (source === 'shop') return [...shopExceptions]
  if (source === 'location') return [...(locationExceptions ?? [])]
  return []
}

/**
 * Dünden itibaren geçerli istisnalar. Dün de dahildir: gece yarısını geçen vardiya
 * (10:00–02:00) saat 01:00'de hâlâ dünün kaydına bakar. Geçmiş kayıtlar kendiliğinden düşer.
 */
export function upcomingExceptions(
  entries: readonly HoursExceptionEntry[],
  now: Date = new Date(),
  timeZone: string = ISTANBUL_TZ,
): HoursExceptionEntry[] {
  const from = addDaysToKey(zonedNow(now, timeZone).dateKey, -1)
  return entries.filter((entry) => entry.date >= from)
}

/** Bugünden itibaren; sitede "özel günler" listesi bunları gösterir (dün geçti, gösterilmez). */
export function futureExceptions(
  entries: readonly HoursExceptionEntry[],
  now: Date = new Date(),
  timeZone: string = ISTANBUL_TZ,
): HoursExceptionEntry[] {
  const today = zonedNow(now, timeZone).dateKey
  return entries.filter((entry) => entry.date >= today)
}

/**
 * Prisma `date` filtresi: dünden itibaren. Sorgu sonucu istemciye gider, bu yüzden
 * geçmiş kayıtlar en baştan dışarıda bırakılır.
 */
export function exceptionDateFilter(
  now: Date = new Date(),
  timeZone: string = ISTANBUL_TZ,
): { gte: Date } {
  const from = addDaysToKey(zonedNow(now, timeZone).dateKey, -1)
  return { gte: dbDateFromKey(from) ?? new Date(0) }
}

/** Panelde ve sitede aynı anda taşınabilecek en fazla istisna; formu ve sayfa yükünü sınırlar. */
export const MAX_EXCEPTIONS = 60
