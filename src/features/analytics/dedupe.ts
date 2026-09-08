import { REPEAT_WINDOW_MS } from '@/lib/analytics/repeat'

/** Bellek şişmesin: bu sayıyı aşınca süresi dolmuş kayıtlar temizlenir. */
const MAX_ENTRIES = 5000

const seen = new Map<string, number>()

/**
 * Aynı ziyaretçinin aynı olayı pencere içinde tekrarladı mı? İlk olay yazılır, pencere
 * dolana kadarki tekrarları yazılmaz; pencere ilk olaydan itibaren işler (tekrarlar süreyi
 * uzatmaz), böylece kuralı patrona tek cümleyle anlatabiliyoruz.
 *
 * `rate-limit.ts` gibi bellekte tutulur: sunucu örneği başına çalışır (Vercel'de birden çok
 * örnek olabilir), yani kesin değil. Arka arkaya gelen tıklamalar pratikte aynı örneğe düştüğü
 * için amacına ulaşır ve ücretsiz katmanda hiçbir şeye mal olmaz.
 */
export function isRepeatEvent(key: string, now: number): boolean {
  const expiresAt = seen.get(key)
  if (expiresAt !== undefined && expiresAt > now) return true
  if (seen.size >= MAX_ENTRIES) sweep(now)
  seen.set(key, now + REPEAT_WINDOW_MS)
  return false
}

function sweep(now: number): void {
  for (const [key, expiresAt] of seen) {
    if (expiresAt <= now) seen.delete(key)
  }
}

/** Testler için. */
export function resetDedupe(): void {
  seen.clear()
}
