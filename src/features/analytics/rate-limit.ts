/** Bir ziyaretçi bir dakikada en çok bu kadar olay yazdırabilir. */
export const RATE_LIMIT = 120
const WINDOW_MS = 60_000
/** Bellek şişmesin: bu sayıyı aşınca süresi dolmuş kayıtlar temizlenir. */
const MAX_ENTRIES = 5000

const buckets = new Map<string, { count: number; resetAt: number }>()

/**
 * Ziyaretçi başına basit sayaç. Sunucu örneği başına çalışır (Vercel'de birden çok örnek
 * olabilir), bu yüzden kesin bir sınır değil; amacı tek bir betiğin sayaçları şişirmesini
 * zorlaştırmak. Kalıcı depo gerektirmediği için ücretsiz katmanda bedavaya gelir.
 */
export function checkRateLimit(key: string, now: number): boolean {
  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    if (buckets.size >= MAX_ENTRIES) sweep(now)
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }
  bucket.count += 1
  return bucket.count <= RATE_LIMIT
}

function sweep(now: number): void {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key)
  }
}

/** Testler için. */
export function resetRateLimit(): void {
  buckets.clear()
}
