import 'server-only'
import type { AnalyticsEventType, DeviceKind } from '@/generated/prisma/enums'
import { db } from '@/lib/db'
import { TIME_ZONE, type DateRange } from './range'

export interface EventTotals {
  PAGE_VIEW: number
  CALL_CLICK: number
  WHATSAPP_CLICK: number
  DIRECTIONS_CLICK: number
  INSTAGRAM_CLICK: number
  SHOP_CARD_CLICK: number
  LOCATION_CARD_CLICK: number
  CAMPAIGN_CLICK: number
  GALLERY_OPEN: number
}

const EMPTY_TOTALS: EventTotals = {
  PAGE_VIEW: 0,
  CALL_CLICK: 0,
  WHATSAPP_CLICK: 0,
  DIRECTIONS_CLICK: 0,
  INSTAGRAM_CLICK: 0,
  SHOP_CARD_CLICK: 0,
  LOCATION_CARD_CLICK: 0,
  CAMPAIGN_CLICK: 0,
  GALLERY_OPEN: 0,
}

/** Dükkan satırındaki sayılar; tıklama türleri ayrı ayrı durur ki panelde sütun olsun. */
export interface ShopStatRow {
  id: string
  name: string
  slug: string
  isActive: boolean
  isTrashed: boolean
  totals: EventTotals
  /** Sıralama ve "ilgi" ölçüsü: sayfa görüntüleme dışındaki her şey. */
  interactions: number
}

export interface NamedCount {
  key: string
  label: string
  count: number
}

export interface DailyPoint {
  dayKey: string
  views: number
  visitors: number
  interactions: number
}

export interface AnalyticsOverview {
  totals: EventTotals
  /** Aralıktaki günlerin tekil ziyaretçilerinin toplamı (hash günlük döner: kişi takip edilmez). */
  visitors: number
  daily: DailyPoint[]
  shops: ShopStatRow[]
  locations: NamedCount[]
  paths: NamedCount[]
  sources: NamedCount[]
  campaigns: NamedCount[]
  devices: { mobile: number; desktop: number }
  /** Aralıkta hiç olay yoksa panel "ölçüm başlamadı" der. */
  isEmpty: boolean
}

function toTotals(rows: { type: AnalyticsEventType; _count: { _all: number } }[]): EventTotals {
  const totals = { ...EMPTY_TOTALS }
  for (const row of rows) totals[row.type] += row._count._all
  return totals
}

function sumInteractions(totals: EventTotals): number {
  return (
    totals.CALL_CLICK +
    totals.WHATSAPP_CLICK +
    totals.DIRECTIONS_CLICK +
    totals.INSTAGRAM_CLICK +
    totals.SHOP_CARD_CLICK +
    totals.LOCATION_CARD_CLICK +
    totals.CAMPAIGN_CLICK +
    totals.GALLERY_OPEN
  )
}

async function shopRows(from: Date): Promise<ShopStatRow[]> {
  const grouped = await db.analyticsEvent.groupBy({
    by: ['shopId', 'type'],
    where: { createdAt: { gte: from }, shopId: { not: null } },
    _count: { _all: true },
  })
  if (grouped.length === 0) return []

  const byShop = new Map<string, EventTotals>()
  for (const row of grouped) {
    const totals = byShop.get(row.shopId!) ?? { ...EMPTY_TOTALS }
    totals[row.type] += row._count._all
    byShop.set(row.shopId!, totals)
  }
  const shops = await db.shop.findMany({
    where: { id: { in: [...byShop.keys()] } },
    select: { id: true, name: true, slug: true, isActive: true, deletedAt: true },
  })
  return shops.map((shop) => {
    const totals = byShop.get(shop.id)!
    return {
      id: shop.id,
      name: shop.name,
      slug: shop.slug,
      isActive: shop.isActive,
      isTrashed: shop.deletedAt !== null,
      totals,
      interactions: sumInteractions(totals),
    }
  })
}

async function locationRows(from: Date): Promise<NamedCount[]> {
  const grouped = await db.analyticsEvent.groupBy({
    by: ['locationId'],
    where: { createdAt: { gte: from }, locationId: { not: null } },
    _count: { _all: true },
  })
  if (grouped.length === 0) return []
  const locations = await db.location.findMany({
    where: { id: { in: grouped.map((row) => row.locationId!) } },
    select: { id: true, name: true },
  })
  const names = new Map(locations.map((row) => [row.id, row.name]))
  return grouped
    .map((row) => ({
      key: row.locationId!,
      label: names.get(row.locationId!) ?? '—',
      count: row._count._all,
    }))
    .sort((a, b) => b.count - a.count)
}

async function campaignRows(from: Date): Promise<NamedCount[]> {
  const grouped = await db.analyticsEvent.groupBy({
    by: ['campaignId'],
    where: { createdAt: { gte: from }, campaignId: { not: null }, type: 'CAMPAIGN_CLICK' },
    _count: { _all: true },
  })
  if (grouped.length === 0) return []
  const campaigns = await db.campaign.findMany({
    where: { id: { in: grouped.map((row) => row.campaignId!) } },
    select: { id: true, title: true },
  })
  const titles = new Map(campaigns.map((row) => [row.id, row.title]))
  return grouped
    .map((row) => ({
      key: row.campaignId!,
      label: titles.get(row.campaignId!) ?? '—',
      count: row._count._all,
    }))
    .sort((a, b) => b.count - a.count)
}

async function pathRows(from: Date, take: number): Promise<NamedCount[]> {
  const grouped = await db.analyticsEvent.groupBy({
    by: ['path'],
    where: { createdAt: { gte: from }, type: 'PAGE_VIEW' },
    _count: { _all: true },
    orderBy: { _count: { path: 'desc' } },
    take,
  })
  return grouped.map((row) => ({ key: row.path, label: row.path, count: row._count._all }))
}

async function sourceRows(from: Date, take: number): Promise<NamedCount[]> {
  const grouped = await db.analyticsEvent.groupBy({
    by: ['source'],
    where: { createdAt: { gte: from }, type: 'PAGE_VIEW', source: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { source: 'desc' } },
    take,
  })
  return grouped.map((row) => ({ key: row.source!, label: row.source!, count: row._count._all }))
}

async function deviceCounts(from: Date): Promise<{ mobile: number; desktop: number }> {
  const grouped = await db.analyticsEvent.groupBy({
    by: ['device'],
    where: { createdAt: { gte: from }, type: 'PAGE_VIEW' },
    _count: { _all: true },
  })
  const find = (device: DeviceKind) =>
    grouped.find((row) => row.device === device)?._count._all ?? 0
  return { mobile: find('MOBILE'), desktop: find('DESKTOP') }
}

interface DailyRaw {
  day: Date
  views: bigint
  visitors: bigint
  interactions: bigint
}

/**
 * Günlük seri. Gün sınırı İstanbul takvimine göre çizilir: `createdAt` saat dilimsiz UTC
 * saklandığı için önce UTC olarak yorumlanır, sonra yerel güne çevrilir.
 */
async function dailyPoints(range: DateRange): Promise<DailyPoint[]> {
  const rows = await db.$queryRaw<DailyRaw[]>`
    SELECT (("createdAt" AT TIME ZONE 'UTC' AT TIME ZONE ${TIME_ZONE})::date) AS day,
           count(*) FILTER (WHERE "type" = 'PAGE_VIEW') AS views,
           count(DISTINCT "visitorHash") AS visitors,
           count(*) FILTER (WHERE "type" <> 'PAGE_VIEW') AS interactions
    FROM "AnalyticsEvent"
    WHERE "createdAt" >= ${range.from}
    GROUP BY 1
    ORDER BY 1
  `
  const byKey = new Map(rows.map((row) => [row.day.toISOString().slice(0, 10), row]))
  return range.dayKeys.map((dayKey) => {
    const row = byKey.get(dayKey)
    return {
      dayKey,
      views: Number(row?.views ?? 0),
      visitors: Number(row?.visitors ?? 0),
      interactions: Number(row?.interactions ?? 0),
    }
  })
}

/** Özet sayfasının kartı için tek sorgu: yalnızca tür toplamları. */
export async function getEventTotals(from: Date): Promise<EventTotals> {
  const grouped = await db.analyticsEvent.groupBy({
    by: ['type'],
    where: { createdAt: { gte: from } },
    _count: { _all: true },
  })
  return toTotals(grouped)
}

/** Panelin tek sorgu noktası: bütün tablolar tek turda, paralel çalışır. */
export async function getAnalyticsOverview(range: DateRange): Promise<AnalyticsOverview> {
  const { from } = range
  const [typeGroups, daily, shops, locations, paths, sources, campaigns, devices] =
    await Promise.all([
      db.analyticsEvent.groupBy({
        by: ['type'],
        where: { createdAt: { gte: from } },
        _count: { _all: true },
      }),
      dailyPoints(range),
      shopRows(from),
      locationRows(from),
      pathRows(from, 15),
      sourceRows(from, 8),
      campaignRows(from),
      deviceCounts(from),
    ])

  const totals = toTotals(typeGroups)
  return {
    totals,
    visitors: daily.reduce((sum, point) => sum + point.visitors, 0),
    daily,
    shops,
    locations,
    paths,
    sources,
    campaigns,
    devices,
    isEmpty: typeGroups.length === 0,
  }
}
