import 'dotenv/config'
import { db } from '@/lib/db'
import { serverEnv } from '@/lib/env.server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { SEED_CAMPAIGNS, SEED_LOCATIONS, SEED_SHOPS, SEED_STAFF, type SeedHours } from './seed/data'
import { uploadPlaceholder } from './seed/media'
import { ensureAuthUser } from '@/features/staff/bootstrap'

const DAYS = [1, 2, 3, 4, 5, 6, 7] as const

function weekOf(hours: SeedHours) {
  return DAYS.map((dayOfWeek) => ({
    dayOfWeek,
    opensAt: hours.opensAt,
    closesAt: hours.closesAt,
    isClosed: false,
  }))
}

async function seedSettings() {
  await db.siteSettings.upsert({
    where: { id: 1 },
    create: {
      id: 1,
      brandName: 'Black',
      heroTitle: 'Black ile şehrin keyfi tek çatı altında',
      heroSubtitle:
        'PlayStation, internet kafe, yeme-içme ve konaklama. Tüm dükkanlarımız, kampanyalarımız ve iletişim bilgilerimiz burada.',
      contactPhone: '0555 000 00 00',
      instagramUrl: 'https://instagram.com/black',
    },
    update: {},
  })
}

async function seedLocations(supabase: ReturnType<typeof createSupabaseAdminClient>) {
  const ids = new Map<string, string>()
  for (const loc of SEED_LOCATIONS) {
    const cover =
      loc.kind === 'VENUE'
        ? await uploadPlaceholder(
            db,
            supabase,
            serverEnv.SUPABASE_STORAGE_BUCKET,
            `seed/locations/${loc.slug}-cover.webp`,
            { title: loc.name, subtitle: 'Mekan', hue: loc.hue, width: 1600, height: 900 },
            `${loc.name} kapak görseli`,
          )
        : null

    const data = {
      name: loc.name,
      kind: loc.kind,
      description: loc.description ?? null,
      address: loc.address ?? null,
      mapUrl: loc.mapUrl ?? null,
      phone: loc.phone ?? null,
      whatsapp: loc.whatsapp ?? null,
      coverImageId: cover?.id ?? null,
      sortOrder: loc.sortOrder,
      isActive: true,
    }
    const saved = await db.location.upsert({
      where: { slug: loc.slug },
      create: { slug: loc.slug, ...data },
      update: data,
    })
    ids.set(loc.slug, saved.id)

    await db.openingHours.deleteMany({ where: { locationId: saved.id } })
    if (loc.hours) {
      await db.openingHours.createMany({
        data: weekOf(loc.hours).map((h) => ({ ...h, locationId: saved.id })),
      })
    }
  }
  return ids
}

async function seedShops(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  locationIds: Map<string, string>,
) {
  const ids = new Map<string, string>()
  for (const shop of SEED_SHOPS) {
    const bucket = serverEnv.SUPABASE_STORAGE_BUCKET
    const cover = await uploadPlaceholder(
      db,
      supabase,
      bucket,
      `seed/shops/${shop.slug}-cover.webp`,
      { title: shop.name, hue: shop.hue, width: 1600, height: 900 },
      `${shop.name} kapak görseli`,
    )

    const data = {
      name: shop.name,
      type: shop.type,
      locationId: shop.locationSlug ? (locationIds.get(shop.locationSlug) ?? null) : null,
      description: shop.description,
      address: shop.address ?? null,
      phone: shop.phone ?? null,
      whatsapp: shop.whatsapp ?? null,
      instagramUrl: shop.instagramUrl ?? null,
      features: shop.features,
      coverImageId: cover.id,
      sortOrder: shop.sortOrder,
      isActive: true,
    }
    const saved = await db.shop.upsert({
      where: { slug: shop.slug },
      create: { slug: shop.slug, ...data },
      update: data,
    })
    ids.set(shop.slug, saved.id)

    await db.openingHours.deleteMany({ where: { shopId: saved.id } })
    if (shop.hours) {
      await db.openingHours.createMany({
        data: weekOf(shop.hours).map((h) => ({ ...h, shopId: saved.id })),
      })
    }

    await db.galleryImage.deleteMany({ where: { shopId: saved.id } })
    for (let i = 0; i < 3; i += 1) {
      const media = await uploadPlaceholder(
        db,
        supabase,
        bucket,
        `seed/shops/${shop.slug}-gallery-${i + 1}.webp`,
        {
          title: shop.name,
          subtitle: `Galeri ${i + 1}`,
          hue: (shop.hue + i * 25) % 360,
          width: 1200,
          height: 900,
        },
        `${shop.name} galeri ${i + 1}`,
      )
      await db.galleryImage.create({ data: { mediaId: media.id, shopId: saved.id, sortOrder: i } })
    }

    await db.priceCategory.deleteMany({ where: { shopId: saved.id } })
    for (const [ci, category] of shop.priceCategories.entries()) {
      await db.priceCategory.create({
        data: {
          shopId: saved.id,
          name: category.name,
          description: category.description ?? null,
          sortOrder: ci,
          items: {
            create: category.items.map((item, ii) => ({
              name: item.name,
              description: item.description ?? null,
              price: item.price,
              unit: item.unit ?? null,
              isFeatured: item.isFeatured ?? false,
              sortOrder: ii,
            })),
          },
        },
      })
    }
  }
  return ids
}

async function seedCampaigns(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  shopIds: Map<string, string>,
  locationIds: Map<string, string>,
  createdById: string,
) {
  await db.campaign.deleteMany({})
  for (const [i, c] of SEED_CAMPAIGNS.entries()) {
    const image = await uploadPlaceholder(
      db,
      supabase,
      serverEnv.SUPABASE_STORAGE_BUCKET,
      `seed/campaigns/campaign-${i + 1}.webp`,
      { title: c.title, subtitle: 'Kampanya', hue: c.hue, width: 1600, height: 900 },
      c.title,
    )
    await db.campaign.create({
      data: {
        title: c.title,
        description: c.description,
        imageId: image.id,
        scope: c.scope,
        shopId: c.scope === 'SHOP' && c.targetSlug ? shopIds.get(c.targetSlug) : null,
        locationId: c.scope === 'LOCATION' && c.targetSlug ? locationIds.get(c.targetSlug) : null,
        ctaLabel: c.ctaLabel ?? null,
        isActive: true,
        sortOrder: i,
        createdById,
      },
    })
  }
}

async function seedStaff(
  supabase: ReturnType<typeof createSupabaseAdminClient>,
  shopIds: Map<string, string>,
) {
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

async function main() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_SEED !== 'true') {
    throw new Error('Seed canlı ortamda çalıştırılmaz. Gerekirse ALLOW_SEED=true verin.')
  }
  const supabase = createSupabaseAdminClient()

  await seedSettings()
  const locationIds = await seedLocations(supabase)
  const shopIds = await seedShops(supabase, locationIds)
  const ownerId = await seedStaff(supabase, shopIds)
  await seedCampaigns(supabase, shopIds, locationIds, ownerId)

  console.warn(
    `Seed tamam: ${locationIds.size} mekan, ${shopIds.size} dükkan, ${SEED_CAMPAIGNS.length} kampanya.`,
  )
  console.warn(
    `Giriş: ${SEED_STAFF.owner.email} / ${SEED_STAFF.owner.password}  |  ${SEED_STAFF.manager.email} / ${SEED_STAFF.manager.password}`,
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.$disconnect()
  })
