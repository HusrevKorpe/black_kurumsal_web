import sharp from 'sharp'
import { describe, expect, it } from 'vitest'
import { campaignFormSchema } from '@/features/campaigns/schema'
import { dayHoursSchema } from '@/features/hours/schema'
import { locationFormSchema } from '@/features/locations/schema'
import { priceCategorySchema, priceItemSchema } from '@/features/pricing/schema'
import { shopFormSchema } from '@/features/shops/schema'
import {
  DEFAULT_DEMO_SHOP_SLUGS,
  DEMO_CAMPAIGNS,
  DEMO_LOCATIONS,
  DEMO_SHOPS,
  type DemoHours,
} from './demo-data'
import { renderPlaceholder } from './demo-media'
import { SKELETON_LOCATIONS, SKELETON_SHOPS } from './skeleton-data'

const shopSlugs = new Set<string>(SKELETON_SHOPS.map((s) => s.slug))
const locationSlugs = new Set<string>(SKELETON_LOCATIONS.map((l) => l.slug))

const shopDetailShape = shopFormSchema.pick({
  description: true,
  address: true,
  mapUrl: true,
  phone: true,
  whatsapp: true,
  instagramUrl: true,
  features: true,
})
const locationDetailShape = locationFormSchema.pick({
  description: true,
  address: true,
  mapUrl: true,
  phone: true,
  whatsapp: true,
})

function expectValidHours(hours: DemoHours) {
  const parsed = dayHoursSchema.safeParse({ dayOfWeek: 1, isClosed: false, ...hours })
  expect(parsed.success, JSON.stringify(hours)).toBe(true)
}

describe('örnek içerik verisi (demo-data)', () => {
  it('varsayılan küme: 5 iskelet dükkanı, her tür, iki bölge ve Garden içinden bir dükkan', () => {
    expect(DEFAULT_DEMO_SHOP_SLUGS).toHaveLength(5)
    expect(new Set(DEFAULT_DEMO_SHOP_SLUGS).size).toBe(5)
    const selected = SKELETON_SHOPS.filter((s) =>
      (DEFAULT_DEMO_SHOP_SLUGS as readonly string[]).includes(s.slug),
    )
    expect(selected).toHaveLength(5)
    expect(new Set(selected.map((s) => s.type))).toEqual(
      new Set(['PLAYSTATION', 'INTERNET_CAFE', 'FOOD', 'APART']),
    )
    expect(new Set(selected.map((s) => s.locationSlug))).toEqual(
      new Set(['carsi', 'iyas', 'black-garden', null]),
    )
  })

  it('her iskelet dükkanının demo ayrıntısı vardır ve panel formundan geçer', () => {
    for (const shop of SKELETON_SHOPS) {
      const demo = DEMO_SHOPS[shop.slug]
      const parsed = shopDetailShape.safeParse({
        description: demo.description,
        address: demo.address ?? '',
        mapUrl: '',
        phone: demo.phone ?? '',
        whatsapp: demo.whatsapp ?? '',
        instagramUrl: demo.instagramUrl ?? '',
        features: demo.features,
      })
      expect(parsed.success, `${shop.slug}: ${JSON.stringify(parsed.error?.issues)}`).toBe(true)
      expect(demo.description.length).toBeGreaterThan(20)
      expect(demo.features.length).toBeGreaterThan(0)
      expect(demo.priceCategories.length).toBeGreaterThan(0)
      if (demo.hours) expectValidHours(demo.hours)
    }
  })

  it('Garden içindeki dükkanlar adres, telefon ve saati mekandan devralır (kendi kaydı yok)', () => {
    const gardenShops = SKELETON_SHOPS.filter((s) => s.locationSlug === 'black-garden')
    expect(gardenShops).toHaveLength(4)
    for (const shop of gardenShops) {
      const demo = DEMO_SHOPS[shop.slug]
      expect([demo.address, demo.phone, demo.hours]).toEqual([undefined, undefined, undefined])
    }
    const garden = DEMO_LOCATIONS['black-garden']
    expect(garden.address).toBeTruthy()
    expect(garden.phone).toBeTruthy()
    expectValidHours(garden.hours as DemoHours)
    expect(locationDetailShape.safeParse({ ...garden, mapUrl: garden.mapUrl ?? '' }).success).toBe(
      true,
    )
  })

  it('bölgelerin (Çarşı, Iyaş) dolduracak ayrıntısı yoktur; yalnızca görsel rengi', () => {
    expect(Object.keys(DEMO_LOCATIONS.carsi)).toEqual(['hue'])
    expect(Object.keys(DEMO_LOCATIONS.iyas)).toEqual(['hue'])
  })

  it('fiyat listeleri panel doğrulamasından geçer; bilgi listesi (fiyatsız) kalemler de olabilir', () => {
    let priceless = 0
    for (const shop of SKELETON_SHOPS) {
      for (const category of DEMO_SHOPS[shop.slug].priceCategories) {
        const cat = priceCategorySchema.safeParse({
          shopId: 'x',
          name: category.name,
          description: category.description ?? '',
        })
        expect(cat.success, `${shop.slug}/${category.name}`).toBe(true)
        expect(category.items.length).toBeGreaterThan(0)
        for (const item of category.items) {
          const parsed = priceItemSchema.safeParse({
            categoryId: 'x',
            ...item,
            description: item.description ?? '',
            unit: item.unit ?? '',
          })
          expect(parsed.success, `${shop.slug}/${category.name}/${item.name}`).toBe(true)
          if (item.price === null) priceless += 1
        }
      }
    }
    expect(priceless).toBeGreaterThan(0)
  })

  it('örnek kampanyalar panel formundan geçer ve hedefleri iskelette vardır', () => {
    expect(DEMO_CAMPAIGNS.map((c) => c.scope)).toEqual(['GLOBAL', 'SHOP', 'LOCATION'])
    for (const campaign of DEMO_CAMPAIGNS) {
      const shopId = campaign.scope === 'SHOP' ? campaign.targetSlug : null
      const locationId = campaign.scope === 'LOCATION' ? campaign.targetSlug : null
      if (shopId) expect(shopSlugs.has(shopId)).toBe(true)
      if (locationId) expect(locationSlugs.has(locationId)).toBe(true)
      const parsed = campaignFormSchema.safeParse({
        title: campaign.title,
        description: campaign.description,
        imageId: 'x',
        scope: campaign.scope,
        shopId,
        locationId,
        ctaLabel: campaign.ctaLabel ?? '',
        ctaUrl: '',
        startsAt: '',
        endsAt: '',
        isActive: true,
        sortOrder: 0,
      })
      expect(parsed.success, `${campaign.title}: ${JSON.stringify(parsed.error?.issues)}`).toBe(
        true,
      )
    }
  })
})

describe('yer tutucu görsel (renderPlaceholder)', () => {
  it('istenen boyutta WebP üretir; başlıktaki özel karakterler SVG’yi bozmaz', async () => {
    const buffer = await renderPlaceholder({
      title: 'Black & "Tost" <Çarşı>',
      subtitle: 'Galeri 1',
      hue: 35,
      width: 320,
      height: 180,
    })
    const meta = await sharp(buffer).metadata()
    expect(meta).toMatchObject({ format: 'webp', width: 320, height: 180 })
    expect(buffer.byteLength).toBeGreaterThan(500)
  })
})
