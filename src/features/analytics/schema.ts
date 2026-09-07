import { z } from 'zod'
import type { AnalyticsEventType } from '@/generated/prisma/enums'

/**
 * Tarayıcıdaki `data-track` değerleri ile veritabanı türleri arasındaki eşleme.
 * Kısa adlar HTML'de durur (sayfa boyutu), uzun adlar veritabanında (okunurluk).
 * Yeni tür eklemek migration ister; buraya eklemek yetmez.
 */
export const TRACK_NAMES: Record<string, AnalyticsEventType> = {
  view: 'PAGE_VIEW',
  call: 'CALL_CLICK',
  whatsapp: 'WHATSAPP_CLICK',
  directions: 'DIRECTIONS_CLICK',
  instagram: 'INSTAGRAM_CLICK',
  shop: 'SHOP_CARD_CLICK',
  location: 'LOCATION_CARD_CLICK',
  campaign: 'CAMPAIGN_CLICK',
  gallery: 'GALLERY_OPEN',
}

/** Panelin ve API'nin kendi trafiği sayılmaz. */
const IGNORED_PREFIXES = ['/admin', '/api', '/monitoring', '/_next']

/**
 * Yol değerini güvenli ve karşılaştırılabilir hâle getirir: sorgu dizesi ve çapa atılır
 * (aynı sayfa tek satırda toplansın), sonundaki eğik çizgi silinir, panel yolları elenir.
 * Kabul edilmeyen her şey için null → olay hiç yazılmaz.
 */
export function sanitizePath(input: string): string | null {
  if (!input.startsWith('/') || input.startsWith('//')) return null
  const path = input.split(/[?#]/)[0]!
  if (path.length > 200 || /[^\p{L}\p{N}\-._~/%]/u.test(path)) return null
  if (IGNORED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`)))
    return null
  const trimmed = path.length > 1 ? path.replace(/\/+$/, '') : path
  return trimmed === '' ? '/' : trimmed
}

/** Sonuç null olabilir: geçersiz ya da sayılmayan yol → olay yazılmaz. */
const pathSchema = z.string().max(300).transform(sanitizePath)

/**
 * Tarayıcının `navigator.sendBeacon` ile gönderdiği gövde. Alan adları kısa tutulmaz:
 * günde birkaç bin istekte okunurluk, birkaç bayttan değerli.
 */
export const trackEventSchema = z.object({
  type: z
    .string()
    .max(20)
    .refine((name) => name in TRACK_NAMES, 'Bilinmeyen olay'),
  /** Olayın gerçekleştiği sayfa. */
  path: pathSchema,
  /** Tıklanan bağlantının hedefi (kart tıklamalarında sayfadan farklıdır). */
  target: pathSchema.optional(),
  campaignId: z.uuid().optional(),
  /** Yalnızca sayfa görüntülemede gönderilir: ziyaretçiyi getiren adres. */
  referrer: z.string().max(500).optional(),
})

export type TrackEventInput = z.infer<typeof trackEventSchema>
