import { timingSafeEqual } from 'node:crypto'

/**
 * Vercel Cron istekleri `Authorization: Bearer <CRON_SECRET>` başlığıyla gelir.
 * Gizli anahtar tanımlı değilse hiçbir istek yetkili sayılmaz: korumasız cron ucu olmaz.
 */
export function isCronRequestAuthorized(request: Request, secret: string | undefined): boolean {
  if (!secret) return false
  const header = request.headers.get('authorization') ?? ''
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length) : ''
  if (!token) return false
  const given = Buffer.from(token)
  const expected = Buffer.from(secret)
  return given.length === expected.length && timingSafeEqual(given, expected)
}
