import { logAudit } from '@/features/audit/log'
import type { PrismaClient } from '@/generated/prisma/client'
import {
  DEFAULT_DEMO_SHOP_SLUGS,
  DEMO_CAMPAIGNS,
  DEMO_LOCATIONS,
  DEMO_SHOPS,
  type DemoCampaign,
} from './demo-data'
import {
  GALLERY_COUNT,
  resolveCampaignTarget,
  uploadCampaignImage,
  uploadLocationCover,
  uploadShopImages,
  writeCampaign,
  writeLocationDetails,
  writeShopDetails,
} from './demo-fill'
import type { ImageUploader, UploadedImage } from './demo-media'
import { SKELETON_LOCATIONS, SKELETON_SHOPS } from './skeleton-data'

/**
 * Örnek içerik (`pnpm content:demo`): seçili dükkanları demo ayrıntılarla doldurur; bağlı oldukları mekanı
 * (Garden: adres, saat, kapak) ve tabloda hiç kampanya yoksa örnek kampanyaları da açar. Kural: yalnızca BOŞ
 * kayda yazılır. Panelden girilmiş tek bir alanı, saati, görseli ya da fiyatı olan dükkan/mekan olduğu gibi
 * bırakılır ve "atlandı" olarak raporlanır; tekrar çalıştırmak güvenlidir. Her dükkan kendi transaction'ında
 * yazılır (görseller önce yüklenir, boşluk transaction içinde yeniden doğrulanır) ve günlüğe `content.demo`
 * satırı düşer ki patron içeriğin nereden geldiğini görsün.
 */
export interface ApplyDemoOptions {
  upload: ImageUploader
  /** Doldurulacak dükkanlar (iskelet slug'ları). Varsayılan: `DEFAULT_DEMO_SHOP_SLUGS`. */
  shopSlugs?: readonly string[]
}

/** Bir kayıt grubunda bu çağrıda doldurulan ve dolu olduğu için atlanan slug'lar. */
export interface DemoPart {
  filled: string[]
  skipped: string[]
}

export interface ApplyDemoResult {
  locations: DemoPart
  shops: DemoPart
  /** Açılan kampanya başlıkları; tabloda zaten kampanya varsa hiçbiri açılmaz (`skipped: true`). */
  campaigns: { created: string[]; skipped: boolean }
}

type ShopEntry = (typeof SKELETON_SHOPS)[number]
type LocationEntry = (typeof SKELETON_LOCATIONS)[number]
/** Boşluk sorguları hem ana istemciyle hem transaction içinde çalışır. */
type Client = Pick<PrismaClient, 'location' | 'shop'>

/** Görseller uzak depolamaya yüklendikten sonra yazılır; canlı DB'de uzun listeler için geniş süre. */
const TX_OPTIONS = { timeout: 60_000 }
const ACTION = 'content.demo'

function selectShops(slugs: readonly string[]): ShopEntry[] {
  const wanted = new Set(slugs)
  const selected = SKELETON_SHOPS.filter((shop) => wanted.has(shop.slug))
  const unknown = [...wanted].filter((slug) => !selected.some((shop) => shop.slug === slug))
  if (unknown.length > 0) throw new Error(`İskelette olmayan dükkan: ${unknown.join(', ')}`)
  if (selected.length === 0) throw new Error('Doldurulacak dükkan seçilmedi')
  return selected
}

/** Seçili dükkanların bağlı olduğu mekanlar (VENUE). Bölgelerin (DISTRICT) dolduracak ayrıntısı yoktur. */
function selectVenues(shops: readonly ShopEntry[]): LocationEntry[] {
  const slugs = new Set(shops.map((shop) => shop.locationSlug))
  return SKELETON_LOCATIONS.filter((loc) => loc.kind === 'VENUE' && slugs.has(loc.slug))
}

function missing(name: string): Error {
  return new Error(`${name} veritabanında yok; önce \`pnpm content:init\` çalıştırın`)
}

const LOCATION_SELECT = {
  id: true,
  name: true,
  description: true,
  address: true,
  mapUrl: true,
  phone: true,
  whatsapp: true,
  instagramUrl: true,
  coverImageId: true,
  _count: { select: { hours: true, gallery: true } },
} as const

function findLocation(db: Client, slug: string) {
  return db.location.findUnique({ where: { slug }, select: LOCATION_SELECT })
}

type LocationRow = NonNullable<Awaited<ReturnType<typeof findLocation>>>

function locationHasContent(row: LocationRow): boolean {
  const fields = [
    row.description,
    row.address,
    row.mapUrl,
    row.phone,
    row.whatsapp,
    row.instagramUrl,
    row.coverImageId,
  ]
  return fields.some((value) => value !== null) || row._count.hours + row._count.gallery > 0
}

const SHOP_SELECT = {
  id: true,
  name: true,
  description: true,
  address: true,
  mapUrl: true,
  phone: true,
  whatsapp: true,
  instagramUrl: true,
  coverImageId: true,
  logoImageId: true,
  features: true,
  _count: { select: { hours: true, gallery: true, priceCategories: true } },
} as const

function findShop(db: Client, slug: string) {
  return db.shop.findUnique({ where: { slug }, select: SHOP_SELECT })
}

type ShopRow = NonNullable<Awaited<ReturnType<typeof findShop>>>

function shopHasContent(row: ShopRow): boolean {
  const fields = [
    row.description,
    row.address,
    row.mapUrl,
    row.phone,
    row.whatsapp,
    row.instagramUrl,
    row.coverImageId,
    row.logoImageId,
  ]
  const counts = row._count.hours + row._count.gallery + row._count.priceCategories
  return fields.some((value) => value !== null) || row.features.length > 0 || counts > 0
}

async function fillLocation(
  db: PrismaClient,
  upload: ImageUploader,
  entry: LocationEntry,
  part: DemoPart,
): Promise<void> {
  const row = await findLocation(db, entry.slug)
  if (!row) throw missing(entry.name)
  if (locationHasContent(row)) {
    part.skipped.push(entry.slug)
    return
  }
  const demo = DEMO_LOCATIONS[entry.slug]
  const cover = await uploadLocationCover(upload, row.id, { name: row.name, hue: demo.hue })
  const written = await db.$transaction(async (tx) => {
    const fresh = await findLocation(tx, entry.slug)
    if (!fresh || locationHasContent(fresh)) return false
    await writeLocationDetails(tx, row.id, demo, cover)
    await logAudit(tx, {
      staffId: null,
      action: ACTION,
      entityType: 'Location',
      entityId: row.id,
      summary: `Örnek içerik girildi: ${row.name}`,
      data: { slug: entry.slug, hours: Boolean(demo.hours), cover: true },
    })
    return true
  }, TX_OPTIONS)
  ;(written ? part.filled : part.skipped).push(entry.slug)
}

async function fillShop(
  db: PrismaClient,
  upload: ImageUploader,
  entry: ShopEntry,
  part: DemoPart,
): Promise<void> {
  const row = await findShop(db, entry.slug)
  if (!row) throw missing(entry.name)
  if (shopHasContent(row)) {
    part.skipped.push(entry.slug)
    return
  }
  const demo = DEMO_SHOPS[entry.slug]
  const images = await uploadShopImages(upload, row.id, { name: row.name, hue: demo.hue })
  const written = await db.$transaction(async (tx) => {
    const fresh = await findShop(tx, entry.slug)
    if (!fresh || shopHasContent(fresh)) return false
    await writeShopDetails(tx, row.id, demo, images)
    await logAudit(tx, {
      staffId: null,
      action: ACTION,
      entityType: 'Shop',
      entityId: row.id,
      summary: `Örnek içerik girildi: ${row.name}`,
      data: {
        slug: entry.slug,
        hours: Boolean(demo.hours),
        priceCategories: demo.priceCategories.length,
        gallery: GALLERY_COUNT,
      },
    })
    return true
  }, TX_OPTIONS)
  ;(written ? part.filled : part.skipped).push(entry.slug)
}

/** Genel kampanyalar her zaman; dükkan/mekan kampanyaları yalnızca hedefi bu çalıştırmada seçiliyse. */
function wantedCampaigns(
  shops: readonly ShopEntry[],
  venues: readonly LocationEntry[],
): DemoCampaign[] {
  const shopSlugs = new Set<string>(shops.map((shop) => shop.slug))
  const venueSlugs = new Set<string>(venues.map((venue) => venue.slug))
  return DEMO_CAMPAIGNS.filter((campaign) => {
    if (campaign.scope === 'GLOBAL') return true
    if (campaign.scope === 'SHOP') return shopSlugs.has(campaign.targetSlug)
    return venueSlugs.has(campaign.targetSlug)
  })
}

/** Örnek kampanyalar yalnızca tablo tamamen boşken açılır; patron kampanya girdiyse hiçbirine karışılmaz. */
async function fillCampaigns(
  db: PrismaClient,
  upload: ImageUploader,
  shops: readonly ShopEntry[],
  venues: readonly LocationEntry[],
): Promise<ApplyDemoResult['campaigns']> {
  if ((await db.campaign.count()) > 0) return { created: [], skipped: true }
  const wanted = wantedCampaigns(shops, venues)
  if (wanted.length === 0) return { created: [], skipped: false }

  const owner = await db.staffUser.findFirst({
    where: { role: 'OWNER', isActive: true },
    orderBy: { createdAt: 'asc' },
    select: { id: true },
  })
  const createdById = owner?.id ?? null
  const prepared: { campaign: DemoCampaign; image: UploadedImage }[] = []
  for (const campaign of wanted) {
    prepared.push({ campaign, image: await uploadCampaignImage(upload, createdById, campaign) })
  }

  const created = await db.$transaction(async (tx) => {
    if ((await tx.campaign.count()) > 0) return []
    const titles: string[] = []
    for (const [sortOrder, { campaign, image }] of prepared.entries()) {
      const target = await resolveCampaignTarget(tx, campaign)
      await writeCampaign(tx, campaign, image, { ...target, createdById, sortOrder })
      titles.push(campaign.title)
    }
    await logAudit(tx, {
      staffId: null,
      action: ACTION,
      entityType: 'Campaign',
      summary: `Örnek kampanyalar açıldı: ${titles.length}`,
      data: { titles },
    })
    return titles
  }, TX_OPTIONS)
  return { created, skipped: created.length === 0 }
}

export async function applyDemoContent(
  db: PrismaClient,
  options: ApplyDemoOptions,
): Promise<ApplyDemoResult> {
  const shops = selectShops(options.shopSlugs ?? DEFAULT_DEMO_SHOP_SLUGS)
  const venues = selectVenues(shops)
  const result: ApplyDemoResult = {
    locations: { filled: [], skipped: [] },
    shops: { filled: [], skipped: [] },
    campaigns: { created: [], skipped: false },
  }
  for (const venue of venues) await fillLocation(db, options.upload, venue, result.locations)
  for (const shop of shops) await fillShop(db, options.upload, shop, result.shops)
  result.campaigns = await fillCampaigns(db, options.upload, shops, venues)
  return result
}
