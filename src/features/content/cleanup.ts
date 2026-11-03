import { logAudit } from '@/features/audit/log'
import type { PrismaClient } from '@/generated/prisma/client'
import {
  DEMO_CAMPAIGNS,
  DEMO_LOCATIONS,
  DEMO_SHOPS,
  type DemoHours,
  type DemoPriceCategory,
} from './demo-data'
import type { SkeletonLocationSlug, SkeletonShopSlug } from './skeleton-data'

/**
 * Demo temizliği (`pnpm content:clean`): canlıya `pnpm content:demo` ile giden uydurma bilgiyi açık siteden
 * çıkarır. Uydurma telefon/adres, müşteriyi kimsenin açmadığı bir numaraya ya da olmayan bir sokağa yollar;
 * boş alan ondan iyidir.
 *
 * Kural: YALNIZCA `demo-data.ts`'teki değerle BİREBİR aynı olan alanlara dokunulur. Patron panelden bir alanı
 * değiştirdiyse (gerçek telefon, gerçek fiyat) o alan demo değeriyle eşleşmez ve yerinde kalır.
 *  - Metin alanları (açıklama, adres, telefon, WhatsApp, harita): boşaltılır.
 *  - Özellik listesi: demo listesiyle aynıysa boşaltılır.
 *  - Haftalık saat: 7 günün tamamı demo saatiyse silinir (sayfa "saat bilgisi yok" der).
 *  - Fiyat kategorisi: adı ve tüm ürünleri (ad + fiyat) demo kategorisiyle aynıysa YAYINDAN KALDIRILIR
 *    (`isActive: false`, panelden geri açılabilir).
 *  - Kampanya: başlığı demo kampanyasıyla aynıysa yayından kaldırılır.
 *  - `HIDDEN_SHOP_SLUGS`/`HIDDEN_LOCATION_SLUGS`: gerçek içeriği hiç gelmemiş dükkan ve mekanlar gizlenir
 *    (`isActive: false`); içerik gelince panelden "yayında" yapılır.
 *
 * Eski değerler günlüğe (`content.clean`) yazılır; yanlışlıkla silinen bir şey oradan geri girilebilir.
 * Aynı komutu tekrar çalıştırmak güvenlidir: ikinci seferde yapılacak iş kalmaz.
 */
const TX_OPTIONS = { timeout: 60_000 }
const ACTION = 'content.clean'

/** Gerçek içeriği gelene kadar sitede görünmeyecek dükkanlar (yalnızca demo veya tamamen boş). */
export const HIDDEN_SHOP_SLUGS = [
  'black-tavuk-garden',
  'black-makarna-garden',
] as const satisfies readonly SkeletonShopSlug[]

/** İçindeki dükkanların hepsi gizlenince boş kalan mekanlar. */
export const HIDDEN_LOCATION_SLUGS = [
  'black-garden',
] as const satisfies readonly SkeletonLocationSlug[]

const TEXT_FIELDS = [
  'description',
  'address',
  'mapUrl',
  'phone',
  'whatsapp',
  'instagramUrl',
] as const
type TextField = (typeof TEXT_FIELDS)[number]
type TextValues = Partial<Record<TextField, string | null>>

export interface HourRow {
  dayOfWeek: number
  opensAt: string | null
  closesAt: string | null
  isClosed: boolean
}

export interface PriceCategoryRow {
  id: string
  name: string
  isActive: boolean
  items: { name: string; price: { toString(): string } | null }[]
}

export interface ShopRow extends TextValues {
  id: string
  slug: string
  name: string
  isActive: boolean
  features: string[]
  hours: HourRow[]
  priceCategories: PriceCategoryRow[]
}

export interface LocationRow extends TextValues {
  id: string
  slug: string
  name: string
  isActive: boolean
  hours: HourRow[]
}

export interface CampaignRow {
  id: string
  title: string
  isActive: boolean
}

/** Bir kayıtta yapılacak değişiklik; `cleared` eski değerleri tutar (günlük ve rapor için). */
export interface RecordPlan {
  id: string
  slug: string
  name: string
  cleared: Partial<Record<TextField, string>>
  clearFeatures: string[] | null
  deleteHours: string | null
  hideCategories: { id: string; name: string }[]
  hide: boolean
}

export interface CleanupPlan {
  shops: RecordPlan[]
  locations: RecordPlan[]
  campaigns: { id: string; title: string }[]
}

function sameHours(rows: readonly HourRow[], demo: DemoHours | undefined): boolean {
  if (!demo || rows.length !== 7) return false
  return rows.every(
    (row) => !row.isClosed && row.opensAt === demo.opensAt && row.closesAt === demo.closesAt,
  )
}

function sameCategory(row: PriceCategoryRow, demo: DemoPriceCategory): boolean {
  if (row.name !== demo.name || row.items.length !== demo.items.length) return false
  const key = (name: string, price: number | null) => `${name}|${price === null ? '' : price}`
  const wanted = new Set(demo.items.map((item) => key(item.name, item.price)))
  return row.items.every((item) =>
    wanted.has(key(item.name, item.price === null ? null : Number(item.price.toString()))),
  )
}

function clearedText(row: TextValues, demo: TextValues): RecordPlan['cleared'] {
  const cleared: RecordPlan['cleared'] = {}
  for (const field of TEXT_FIELDS) {
    const value = row[field]
    if (value && demo[field] && value === demo[field]) cleared[field] = value
  }
  return cleared
}

function isEmpty(plan: RecordPlan): boolean {
  return (
    Object.keys(plan.cleared).length === 0 &&
    plan.clearFeatures === null &&
    plan.deleteHours === null &&
    plan.hideCategories.length === 0 &&
    !plan.hide
  )
}

function describeHours(demo: DemoHours): string {
  return `${demo.opensAt}–${demo.closesAt}`
}

/** Ne yapılacağını hesaplar; veritabanına dokunmaz. Yapılacak işi olmayan kayıtlar listeye girmez. */
export function buildCleanupPlan(input: {
  shops: readonly ShopRow[]
  locations: readonly LocationRow[]
  campaigns: readonly CampaignRow[]
}): CleanupPlan {
  const hiddenShops = new Set<string>(HIDDEN_SHOP_SLUGS)
  const hiddenLocations = new Set<string>(HIDDEN_LOCATION_SLUGS)
  const demoTitles = new Set(DEMO_CAMPAIGNS.map((campaign) => campaign.title))

  const shops = input.shops.flatMap((row) => {
    const demo = DEMO_SHOPS[row.slug as SkeletonShopSlug]
    if (!demo) return []
    const sameFeatures =
      row.features.length > 0 &&
      row.features.length === demo.features.length &&
      row.features.every((feature, i) => feature === demo.features[i])
    const plan: RecordPlan = {
      id: row.id,
      slug: row.slug,
      name: row.name,
      cleared: clearedText(row, demo),
      clearFeatures: sameFeatures ? row.features : null,
      deleteHours:
        sameHours(row.hours, demo.hours) && demo.hours ? describeHours(demo.hours) : null,
      hideCategories: row.priceCategories
        .filter((category) => category.isActive)
        .filter((category) => demo.priceCategories.some((d) => sameCategory(category, d)))
        .map((category) => ({ id: category.id, name: category.name })),
      hide: row.isActive && hiddenShops.has(row.slug),
    }
    return isEmpty(plan) ? [] : [plan]
  })

  const locations = input.locations.flatMap((row) => {
    const demo = DEMO_LOCATIONS[row.slug as SkeletonLocationSlug]
    if (!demo) return []
    const plan: RecordPlan = {
      id: row.id,
      slug: row.slug,
      name: row.name,
      cleared: clearedText(row, demo),
      clearFeatures: null,
      deleteHours:
        sameHours(row.hours, demo.hours) && demo.hours ? describeHours(demo.hours) : null,
      hideCategories: [],
      hide: row.isActive && hiddenLocations.has(row.slug),
    }
    return isEmpty(plan) ? [] : [plan]
  })

  const campaigns = input.campaigns
    .filter((campaign) => campaign.isActive && demoTitles.has(campaign.title))
    .map((campaign) => ({ id: campaign.id, title: campaign.title }))

  return { shops, locations, campaigns }
}

const HOURS_SELECT = {
  select: { dayOfWeek: true, opensAt: true, closesAt: true, isClosed: true },
} as const

async function readRows(db: PrismaClient) {
  const [shops, locations, campaigns] = await Promise.all([
    db.shop.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        slug: true,
        name: true,
        isActive: true,
        description: true,
        address: true,
        mapUrl: true,
        phone: true,
        whatsapp: true,
        instagramUrl: true,
        features: true,
        hours: HOURS_SELECT,
        priceCategories: {
          select: {
            id: true,
            name: true,
            isActive: true,
            items: { select: { name: true, price: true } },
          },
        },
      },
    }),
    db.location.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        slug: true,
        name: true,
        isActive: true,
        description: true,
        address: true,
        mapUrl: true,
        phone: true,
        whatsapp: true,
        instagramUrl: true,
        hours: HOURS_SELECT,
      },
    }),
    db.campaign.findMany({ select: { id: true, title: true, isActive: true } }),
  ])
  return { shops, locations, campaigns }
}

export async function planCleanup(db: PrismaClient): Promise<CleanupPlan> {
  return buildCleanupPlan(await readRows(db))
}

function nullFields(cleared: RecordPlan['cleared']): Partial<Record<TextField, null>> {
  return Object.fromEntries(Object.keys(cleared).map((field) => [field, null]))
}

function auditData(plan: RecordPlan) {
  return {
    slug: plan.slug,
    cleared: plan.cleared,
    features: plan.clearFeatures,
    hours: plan.deleteHours,
    hiddenCategories: plan.hideCategories.map((category) => category.name),
    hidden: plan.hide,
  }
}

/** Planı hesaplar ve tek transaction'da yazar. */
export async function applyCleanup(db: PrismaClient): Promise<CleanupPlan> {
  const plan = await planCleanup(db)
  await db.$transaction(async (tx) => {
    for (const shop of plan.shops) {
      await tx.shop.update({
        where: { id: shop.id },
        data: {
          ...nullFields(shop.cleared),
          ...(shop.clearFeatures ? { features: [] } : {}),
          ...(shop.hide ? { isActive: false } : {}),
        },
      })
      if (shop.deleteHours) await tx.openingHours.deleteMany({ where: { shopId: shop.id } })
      if (shop.hideCategories.length > 0) {
        await tx.priceCategory.updateMany({
          where: { id: { in: shop.hideCategories.map((category) => category.id) } },
          data: { isActive: false },
        })
      }
      await logAudit(tx, {
        staffId: null,
        action: ACTION,
        entityType: 'Shop',
        entityId: shop.id,
        summary: `${shop.name}: demo bilgisi kaldırıldı`,
        data: auditData(shop),
      })
    }
    for (const location of plan.locations) {
      await tx.location.update({
        where: { id: location.id },
        data: {
          ...nullFields(location.cleared),
          ...(location.hide ? { isActive: false } : {}),
        },
      })
      if (location.deleteHours) {
        await tx.openingHours.deleteMany({ where: { locationId: location.id } })
      }
      await logAudit(tx, {
        staffId: null,
        action: ACTION,
        entityType: 'Location',
        entityId: location.id,
        summary: `${location.name}: demo bilgisi kaldırıldı`,
        data: auditData(location),
      })
    }
    if (plan.campaigns.length > 0) {
      await tx.campaign.updateMany({
        where: { id: { in: plan.campaigns.map((campaign) => campaign.id) } },
        data: { isActive: false },
      })
      for (const campaign of plan.campaigns) {
        await logAudit(tx, {
          staffId: null,
          action: ACTION,
          entityType: 'Campaign',
          entityId: campaign.id,
          summary: `${campaign.title}: demo kampanya yayından kaldırıldı`,
          data: { title: campaign.title },
        })
      }
    }
  }, TX_OPTIONS)
  return plan
}
