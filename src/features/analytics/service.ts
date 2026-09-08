import 'server-only'
import { zonedNow } from '@/features/hours/time'
import { eventSignature } from '@/lib/analytics/repeat'
import { db } from '@/lib/db'
import { serverEnv } from '@/lib/env.server'
import { isRepeatEvent } from './dedupe'
import { checkRateLimit } from './rate-limit'
import { trackEventSchema, TRACK_NAMES } from './schema'
import {
  clientIpFromHeaders,
  deviceFromUserAgent,
  hashVisitor,
  isBotUserAgent,
  looksLikeStaffRequest,
  normalizeSource,
} from './visitor'

const TIME_ZONE = 'Europe/Istanbul'
/** Slug → kimlik eşlemesi bu kadar süre bellekte tutulur; her olayda veritabanına gidilmez. */
const SLUG_CACHE_MS = 5 * 60 * 1000

export interface RecordResult {
  recorded: boolean
  /** Yazılmadıysa nedeni; uçtan 204 döner, tarayıcı hiçbir şey öğrenmez. */
  reason?: 'bot' | 'staff' | 'rate' | 'repeat' | 'invalid'
}

interface SlugMaps {
  shops: Map<string, string>
  locations: Map<string, string>
  expiresAt: number
}

let slugCache: SlugMaps | null = null

/** Çöp kutusundakiler de eşlenir: silinmiş dükkanın geçmiş olayları da doğru kayda bağlansın. */
async function getSlugMaps(now: number): Promise<SlugMaps> {
  if (slugCache && slugCache.expiresAt > now) return slugCache
  const [shops, locations] = await Promise.all([
    db.shop.findMany({ select: { id: true, slug: true } }),
    db.location.findMany({ select: { id: true, slug: true } }),
  ])
  slugCache = {
    shops: new Map(shops.map((row) => [row.slug, row.id])),
    locations: new Map(locations.map((row) => [row.slug, row.id])),
    expiresAt: now + SLUG_CACHE_MS,
  }
  return slugCache
}

/** Testler ve içerik komutları için: eşleme yeniden okunur. */
export function resetSlugCache(): void {
  slugCache = null
}

interface Target {
  shopId: string | null
  locationId: string | null
}

/** "/mekan/black-garden" → mekan, "/black-tost" → dükkan, "/" ve "/kampanyalar" → hiçbiri. */
async function resolveTarget(path: string, now: number): Promise<Target> {
  const segments = path.split('/').filter(Boolean)
  const maps = await getSlugMaps(now)
  if (segments.length === 2 && segments[0] === 'mekan') {
    return { shopId: null, locationId: maps.locations.get(segments[1]!) ?? null }
  }
  if (segments.length === 1) {
    return { shopId: maps.shops.get(segments[0]!) ?? null, locationId: null }
  }
  return { shopId: null, locationId: null }
}

export interface RecordOptions {
  /** Testlerde sabitlenir. */
  now?: Date
  salt?: string
  siteHost?: string
}

/**
 * Tarayıcıdan gelen tek bir olayı yazar. Robotlar, panel personeli, taşkın istekler ve aynı
 * ziyaretçinin kısa süredeki tekrarları elenir; geri kalan her şey tek INSERT'e iner.
 * Hiçbir hata tarayıcıya yansımaz (uç her zaman 204 döner).
 */
export async function recordEvent(
  body: unknown,
  headers: Headers,
  options: RecordOptions = {},
): Promise<RecordResult> {
  const userAgent = headers.get('user-agent') ?? ''
  if (isBotUserAgent(userAgent)) return { recorded: false, reason: 'bot' }
  if (looksLikeStaffRequest(headers.get('cookie'))) return { recorded: false, reason: 'staff' }

  const parsed = trackEventSchema.safeParse(body)
  if (!parsed.success || parsed.data.path === null) return { recorded: false, reason: 'invalid' }
  const { type, path, target, campaignId, referrer } = parsed.data

  const now = options.now ?? new Date()
  const salt = options.salt ?? serverEnv.ANALYTICS_SALT ?? serverEnv.SUPABASE_SECRET_KEY
  const siteHost = options.siteHost ?? hostOf(process.env.NEXT_PUBLIC_SITE_URL)
  const dateKey = zonedNow(now, TIME_ZONE).dateKey
  const visitorHash = hashVisitor(salt, dateKey, clientIpFromHeaders(headers), userAgent)
  if (!checkRateLimit(visitorHash, now.getTime())) return { recorded: false, reason: 'rate' }
  // Aynı düğmeye arka arkaya basmak tek tıklama sayılır. Tarayıcı da eler; burası sayfa
  // yenilendiğinde, ikinci sekmede ve sayacı elle çağıran istekte devreye giren güvence.
  const repeatKey = `${visitorHash}|${eventSignature({ type, path, target, campaignId })}`
  if (isRepeatEvent(repeatKey, now.getTime())) return { recorded: false, reason: 'repeat' }

  const { shopId, locationId } = await resolveTarget(target ?? path, now.getTime())
  const campaign =
    campaignId &&
    (await db.campaign.findUnique({ where: { id: campaignId }, select: { id: true } }))

  await db.analyticsEvent.create({
    data: {
      type: TRACK_NAMES[type]!,
      path,
      shopId,
      locationId,
      campaignId: campaign ? campaign.id : null,
      source: type === 'view' ? normalizeSource(referrer, siteHost) : null,
      device: deviceFromUserAgent(userAgent),
      visitorHash,
      createdAt: now,
    },
  })
  return { recorded: true }
}

function hostOf(url: string | undefined): string {
  if (!url) return ''
  try {
    return new URL(url).hostname
  } catch {
    return ''
  }
}
