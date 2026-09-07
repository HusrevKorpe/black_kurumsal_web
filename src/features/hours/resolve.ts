import { DAYS_OF_WEEK, type HoursInput, type ResolvedHours, type WeeklyHours } from './types'

/** Eksik günleri "kapalı" olarak tamamlar ve gün sırasına dizer. Panel her zaman 7 gün kaydeder. */
export function normalizeWeek(entries: readonly HoursInput[]): WeeklyHours {
  return DAYS_OF_WEEK.map((day) => {
    const found = entries.find((e) => e.dayOfWeek === day)
    if (!found) return { dayOfWeek: day, opensAt: null, closesAt: null, isClosed: true }
    return found.isClosed
      ? { dayOfWeek: day, opensAt: null, closesAt: null, isClosed: true }
      : { dayOfWeek: day, opensAt: found.opensAt, closesAt: found.closesAt, isClosed: false }
  })
}

/**
 * Kural: dükkanın KENDİ kaydı varsa tamamı geçerli; yoksa mekanın saati; o da yoksa bilinmiyor.
 * Gün bazında karışım yapılmaz.
 */
export function resolveHours(
  shopHours: readonly HoursInput[],
  locationHours: readonly HoursInput[] | null | undefined,
): ResolvedHours {
  if (shopHours.length > 0) return { source: 'shop', week: normalizeWeek(shopHours) }
  if (locationHours && locationHours.length > 0) {
    return { source: 'location', week: normalizeWeek(locationHours) }
  }
  return { source: 'none', week: [] }
}
