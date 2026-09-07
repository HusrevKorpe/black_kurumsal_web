import 'dotenv/config'
import type { SupabaseClient } from '@supabase/supabase-js'
import { DEMO_CAMPAIGNS, DEMO_LOCATIONS, DEMO_SHOPS } from '@/features/content/demo-data'
import {
  resolveCampaignTarget,
  uploadCampaignImage,
  uploadLocationCover,
  uploadShopImages,
  writeCampaign,
  writeLocationDetails,
  writeShopDetails,
} from '@/features/content/demo-fill'
import { createStorageUploader, type ImageUploader } from '@/features/content/demo-media'
import {
  SKELETON_LOCATIONS,
  SKELETON_SETTINGS,
  SKELETON_SHOPS,
} from '@/features/content/skeleton-data'
import { ensureAuthUser } from '@/features/staff/bootstrap'
import { db } from '@/lib/db'
import { serverEnv } from '@/lib/env.server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

/**
 * Yerel geliştirme seed'i: iskeleti (3 mekan/bölge, 11 dükkan) demo içerikle SIFIRDAN doldurur, iki giriş
 * hesabı ve örnek kampanyaları açar. Tekrar çalıştırılınca eski ayrıntı, görsel ve kampanyaları silip yeniden
 * yazar. Canlıda çalıştırılmaz: iskelet `pnpm content:init`, örnek içerik `pnpm content:demo`.
 */
const SEED_STAFF = {
  owner: {
    email: 'patron@black.local',
    fullName: 'Patron',
    password: process.env.SEED_OWNER_PASSWORD ?? 'Patron123!',
  },
  manager: {
    email: 'sorumlu@black.local',
    fullName: 'Çarşı Sorumlusu',
    password: process.env.SEED_MANAGER_PASSWORD ?? 'Sorumlu123!',
    shopSlugs: ['black-playstation-carsi', 'black-internet-kafe-carsi'],
  },
}

const BUCKET = serverEnv.SUPABASE_STORAGE_BUCKET

/** Media satırlarını siler (galeri kayıtları cascade ile düşer) ve depolamadan silinecek yolları döndürür. */
async function deleteMedia(ids: (string | null)[]): Promise<string[]> {
  const wanted = ids.filter((id): id is string => id !== null)
  if (wanted.length === 0) return []
  const rows = await db.media.findMany({ where: { id: { in: wanted } }, select: { path: true } })
  await db.media.deleteMany({ where: { id: { in: wanted } } })
  return rows.map((row) => row.path)
}

async function clearLocation(id: string): Promise<string[]> {
  const location = await db.location.findUniqueOrThrow({
    where: { id },
    select: { coverImageId: true, gallery: { select: { mediaId: true } } },
  })
  await db.openingHours.deleteMany({ where: { locationId: id } })
  return deleteMedia([location.coverImageId, ...location.gallery.map((g) => g.mediaId)])
}

async function clearShop(id: string): Promise<string[]> {
  const shop = await db.shop.findUniqueOrThrow({
    where: { id },
    select: { coverImageId: true, logoImageId: true, gallery: { select: { mediaId: true } } },
  })
  await db.openingHours.deleteMany({ where: { shopId: id } })
  await db.priceCategory.deleteMany({ where: { shopId: id } })
  return deleteMedia([shop.coverImageId, shop.logoImageId, ...shop.gallery.map((g) => g.mediaId)])
}

async function clearCampaigns(): Promise<string[]> {
  const rows = await db.campaign.findMany({ select: { imageId: true } })
  await db.campaign.deleteMany({})
  return deleteMedia(rows.map((row) => row.imageId))
}

async function seedSettings(): Promise<void> {
  await db.siteSettings.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      ...SKELETON_SETTINGS,
      contactPhone: '0555 000 00 00',
      instagramUrl: 'https://instagram.com/black',
    },
    update: {},
  })
}

async function seedLocations(
  upload: ImageUploader,
  removed: string[],
): Promise<Map<string, string>> {
  const ids = new Map<string, string>()
  for (const loc of SKELETON_LOCATIONS) {
    const base = { name: loc.name, kind: loc.kind, sortOrder: loc.sortOrder, isActive: true }
    const saved = await db.location.upsert({
      where: { slug: loc.slug },
      create: { slug: loc.slug, ...base },
      update: base,
      select: { id: true },
    })
    removed.push(...(await clearLocation(saved.id)))
    const demo = DEMO_LOCATIONS[loc.slug]
    const cover =
      loc.kind === 'VENUE'
        ? await uploadLocationCover(upload, saved.id, { name: loc.name, hue: demo.hue })
        : null
    await writeLocationDetails(db, saved.id, demo, cover)
    ids.set(loc.slug, saved.id)
  }
  return ids
}

async function seedShops(
  upload: ImageUploader,
  locationIds: Map<string, string>,
  removed: string[],
): Promise<Map<string, string>> {
  const ids = new Map<string, string>()
  for (const shop of SKELETON_SHOPS) {
    const base = {
      name: shop.name,
      type: shop.type,
      locationId: shop.locationSlug ? (locationIds.get(shop.locationSlug) ?? null) : null,
      sortOrder: shop.sortOrder,
      isActive: true,
    }
    const saved = await db.shop.upsert({
      where: { slug: shop.slug },
      create: { slug: shop.slug, ...base },
      update: base,
      select: { id: true },
    })
    removed.push(...(await clearShop(saved.id)))
    const demo = DEMO_SHOPS[shop.slug]
    const images = await uploadShopImages(upload, saved.id, { name: shop.name, hue: demo.hue })
    await writeShopDetails(db, saved.id, demo, images)
    ids.set(shop.slug, saved.id)
  }
  return ids
}

async function seedStaff(supabase: SupabaseClient, shopIds: Map<string, string>): Promise<string> {
  const { owner, manager } = SEED_STAFF
  const { id: ownerId } = await ensureAuthUser(
    supabase,
    owner.email,
    owner.password,
    owner.fullName,
  )
  await db.staffUser.upsert({
    where: { id: ownerId },
    create: { id: ownerId, email: owner.email, fullName: owner.fullName, role: 'OWNER' },
    update: { email: owner.email, fullName: owner.fullName, role: 'OWNER', isActive: true },
  })

  const { id: managerId } = await ensureAuthUser(
    supabase,
    manager.email,
    manager.password,
    manager.fullName,
  )
  await db.staffUser.upsert({
    where: { id: managerId },
    create: { id: managerId, email: manager.email, fullName: manager.fullName, role: 'MANAGER' },
    update: { email: manager.email, fullName: manager.fullName, role: 'MANAGER', isActive: true },
  })
  await db.staffShopAssignment.deleteMany({ where: { staffId: managerId } })
  await db.staffShopAssignment.createMany({
    data: manager.shopSlugs.flatMap((slug) => {
      const shopId = shopIds.get(slug)
      return shopId ? [{ staffId: managerId, shopId }] : []
    }),
  })
  return ownerId
}

async function seedCampaigns(upload: ImageUploader, createdById: string, removed: string[]) {
  removed.push(...(await clearCampaigns()))
  for (const [sortOrder, campaign] of DEMO_CAMPAIGNS.entries()) {
    const image = await uploadCampaignImage(upload, createdById, campaign)
    const target = await resolveCampaignTarget(db, campaign)
    await writeCampaign(db, campaign, image, { ...target, createdById, sortOrder })
  }
}

/** Eski seed görsellerini depolamadan siler; hata seed'i durdurmaz (DB kaydı zaten silinmiştir). */
async function removeObjects(supabase: SupabaseClient, paths: string[]): Promise<void> {
  if (paths.length === 0) return
  const { error } = await supabase.storage.from(BUCKET).remove(paths)
  if (error) console.warn(`Eski görseller silinemedi: ${error.message}`)
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEED !== 'true') {
    throw new Error('Seed canlı ortamda çalıştırılmaz. Gerekirse ALLOW_SEED=true verin.')
  }
  const supabase = createSupabaseAdminClient()
  const upload = createStorageUploader(supabase, BUCKET)
  const removed: string[] = []

  await seedSettings()
  const locationIds = await seedLocations(upload, removed)
  const shopIds = await seedShops(upload, locationIds, removed)
  const ownerId = await seedStaff(supabase, shopIds)
  await seedCampaigns(upload, ownerId, removed)
  await removeObjects(supabase, removed)

  console.warn(
    `Seed tamam: ${locationIds.size} mekan, ${shopIds.size} dükkan, ${DEMO_CAMPAIGNS.length} kampanya.`,
  )
  console.warn(
    `Giriş: ${SEED_STAFF.owner.email} / ${SEED_STAFF.owner.password}  |  ${SEED_STAFF.manager.email} / ${SEED_STAFF.manager.password}`,
  )
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.$disconnect()
  })
