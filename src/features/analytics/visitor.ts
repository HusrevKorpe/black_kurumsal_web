import { createHash } from 'node:crypto'
import type { DeviceKind } from '@/generated/prisma/enums'

/**
 * Ziyaretçi parmak izi. Kişisel veri saklamamak için IP ve tarayıcı imzası ham hâliyle
 * yazılmaz; günün anahtarıyla birlikte hash'lenir. Gün değişince aynı kişi başka hash alır,
 * yani "aynı gün içinde aynı ziyaretçi mi" sorusuna yeter, kişiyi günler boyu takip etmeye yetmez.
 */
export function hashVisitor(salt: string, dateKey: string, ip: string, userAgent: string): string {
  return createHash('sha256')
    .update(`${salt}|${dateKey}|${ip}|${userAgent}`)
    .digest('hex')
    .slice(0, 16)
}

/** Vercel/proxy başlıklarından ziyaretçi IP'si. Yalnızca hash'lenmek için okunur, saklanmaz. */
export function clientIpFromHeaders(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0]!.trim()
  return headers.get('x-real-ip')?.trim() || 'bilinmiyor'
}

const BOT_PATTERN =
  /bot|crawl|spider|slurp|preview|headless|lighthouse|monitor|curl|wget|python-requests|facebookexternalhit|whatsapp|telegram|semrush|ahrefs|pingdom|gtmetrix|phantom|puppeteer|playwright|chrome-lighthouse/i

/** Tarayıcı imzası yoksa ya da bilinen bir robotsa sayılmaz: sayılar gerçek ziyaretçiyi göstersin. */
export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent || userAgent.trim().length < 10) return true
  return BOT_PATTERN.test(userAgent)
}

const MOBILE_PATTERN = /Mobi|Android|iPhone|iPod|iPad|Windows Phone/i

export function deviceFromUserAgent(userAgent: string): DeviceKind {
  return MOBILE_PATTERN.test(userAgent) ? 'MOBILE' : 'DESKTOP'
}

/** Bilinen yönlendirenler okunur bir ada indirgenir; geri kalanı alan adı olarak kalır. */
const SOURCE_LABELS: Record<string, string> = {
  'google.com': 'google',
  'google.com.tr': 'google',
  'instagram.com': 'instagram',
  'facebook.com': 'facebook',
  'youtube.com': 'youtube',
  'bing.com': 'bing',
  'yandex.com': 'yandex',
  'duckduckgo.com': 'duckduckgo',
  'tiktok.com': 'tiktok',
  'x.com': 'x',
  'twitter.com': 'x',
  't.co': 'x',
}

/**
 * Yönlendiren adresten kaynağı çıkarır. Kendi sitemizden gelen (iç gezinme) ve boş referrer
 * "doğrudan" sayılır → null. Alt alan adları sadeleşir: l.instagram.com → instagram.
 */
export function normalizeSource(
  referrer: string | null | undefined,
  siteHost: string,
): string | null {
  if (!referrer) return null
  let host: string
  try {
    host = new URL(referrer).hostname.toLowerCase()
  } catch {
    return null
  }
  if (!host) return null
  const bare = host.replace(/^(www|m|l|amp)\./, '')
  const site = siteHost.toLowerCase().replace(/^www\./, '')
  if (bare === site || bare.endsWith(`.${site}`)) return null
  return (SOURCE_LABELS[bare] ?? bare).slice(0, 80)
}

/**
 * Panelde oturumu açık personelin gezinmesi ziyaretçi sayılmaz: patron kendi sitesine
 * bakınca WhatsApp sayacı şişmesin. Supabase oturum çerezi varsa istek atlanır.
 */
export function looksLikeStaffRequest(cookieHeader: string | null | undefined): boolean {
  if (!cookieHeader) return false
  return /(?:^|;\s*)sb-[\w-]*auth-token/.test(cookieHeader)
}
