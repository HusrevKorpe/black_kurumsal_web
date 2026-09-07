import { beforeEach, describe, expect, it } from 'vitest'
import { ensureContentSkeleton } from '@/features/content/skeleton'
import {
  SKELETON_LOCATIONS,
  SKELETON_SETTINGS,
  SKELETON_SHOPS,
} from '@/features/content/skeleton-data'
import { db } from '@/lib/db'
import { createLocation, createShop, resetDatabase } from './helpers'

const ALL_LOCATIONS = SKELETON_LOCATIONS.map((l) => l.slug)
const ALL_SHOPS = SKELETON_SHOPS.map((s) => s.slug)

beforeEach(resetDatabase)

describe('içerik iskeleti kurulumu (ensureContentSkeleton)', () => {
  it('boş veritabanında site ayarı, 3 mekan/bölge ve 11 dükkanı doğru bağlarla, aktif açar', async () => {
    const result = await ensureContentSkeleton(db)
    expect(result).toEqual({
      settingsCreated: true,
      locations: { created: ALL_LOCATIONS, existing: [] },
      shops: { created: ALL_SHOPS, existing: [] },
    })

    const settings = await db.siteSettings.findUniqueOrThrow({ where: { id: 1 } })
    expect(settings).toMatchObject({ ...SKELETON_SETTINGS, contactPhone: null, logoImageId: null })

    const locations = await db.location.findMany({ orderBy: { sortOrder: 'asc' } })
    expect(locations.map((l) => [l.slug, l.kind, l.isActive, l.phone])).toEqual(
      SKELETON_LOCATIONS.map((l) => [l.slug, l.kind, true, null]),
    )

    const shops = await db.shop.findMany({
      orderBy: { sortOrder: 'asc' },
      include: { location: { select: { slug: true } } },
    })
    expect(shops.map((s) => [s.slug, s.type, s.location?.slug ?? null, s.isActive])).toEqual(
      SKELETON_SHOPS.map((s) => [s.slug, s.type, s.locationSlug, true]),
    )
    for (const shop of shops) {
      expect(shop).toMatchObject({ phone: null, address: null, description: null, features: [] })
    }
    expect(await db.openingHours.count()).toBe(0)
    expect(await db.priceCategory.count()).toBe(0)

    const logs = await db.auditLog.findMany()
    expect(logs).toHaveLength(1)
    expect(logs[0]).toMatchObject({
      staffId: null,
      action: 'content.skeleton',
      entityType: 'content',
      summary: 'İçerik iskeleti kuruldu: 3 mekan/bölge, 11 dükkan',
    })
  })

  it('ikinci çalıştırma hiçbir şey açmaz ve günlüğe yazmaz', async () => {
    await ensureContentSkeleton(db)
    const second = await ensureContentSkeleton(db)
    expect(second).toEqual({
      settingsCreated: false,
      locations: { created: [], existing: ALL_LOCATIONS },
      shops: { created: [], existing: ALL_SHOPS },
    })
    expect(await db.location.count()).toBe(3)
    expect(await db.shop.count()).toBe(11)
    expect(await db.auditLog.count()).toBe(1)
  })

  it('panelden yapılan düzenlemelere dokunmaz: ad, pasiflik, ayar metni, mekan bağı korunur', async () => {
    await ensureContentSkeleton(db)
    await db.siteSettings.update({ where: { id: 1 }, data: { heroTitle: 'Patronun başlığı' } })
    await db.location.update({ where: { slug: 'carsi' }, data: { name: 'Çarşı Merkez' } })
    await db.shop.update({
      where: { slug: 'black-tost-garden' },
      data: { name: 'Black Tost Garden', isActive: false, locationId: null, phone: '05551112233' },
    })

    await ensureContentSkeleton(db)

    expect((await db.siteSettings.findUniqueOrThrow({ where: { id: 1 } })).heroTitle).toBe(
      'Patronun başlığı',
    )
    expect((await db.location.findUniqueOrThrow({ where: { slug: 'carsi' } })).name).toBe(
      'Çarşı Merkez',
    )
    expect(await db.shop.findUniqueOrThrow({ where: { slug: 'black-tost-garden' } })).toMatchObject(
      {
        name: 'Black Tost Garden',
        isActive: false,
        locationId: null,
        phone: '05551112233',
      },
    )
  })

  it('kısmen dolu veritabanında yalnızca eksikleri açar; dükkanlar var olan mekana bağlanır', async () => {
    const carsi = await createLocation({ slug: 'carsi', name: 'Çarşı (elle)', kind: 'DISTRICT' })
    await createShop({ slug: 'lavinya-apart', name: 'Lavinya (elle)' })
    await db.siteSettings.create({ data: { id: 1, heroTitle: 'Elle girilen' } })

    const result = await ensureContentSkeleton(db)
    expect(result.settingsCreated).toBe(false)
    expect(result.locations).toEqual({ created: ['black-garden', 'iyas'], existing: ['carsi'] })
    expect(result.shops.existing).toEqual(['lavinya-apart'])
    expect(result.shops.created).toEqual(ALL_SHOPS.filter((s) => s !== 'lavinya-apart'))

    const carsiShops = await db.shop.findMany({ where: { locationId: carsi.id } })
    expect(carsiShops.map((s) => s.slug).sort()).toEqual([
      'black-internet-kafe-carsi',
      'black-playstation-carsi',
      'black-tost-carsi',
    ])
    expect((await db.location.findUniqueOrThrow({ where: { id: carsi.id } })).name).toBe(
      'Çarşı (elle)',
    )
    expect((await db.shop.findUniqueOrThrow({ where: { slug: 'lavinya-apart' } })).name).toBe(
      'Lavinya (elle)',
    )
    expect((await db.siteSettings.findUniqueOrThrow({ where: { id: 1 } })).heroTitle).toBe(
      'Elle girilen',
    )
    expect(await db.auditLog.count()).toBe(1)
  })
})
