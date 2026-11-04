import { describe, expect, it } from 'vitest'
import { locationFormSchema } from '@/features/locations/schema'
import { siteSettingsSchema } from '@/features/settings/schema'
import { shopFormSchema } from '@/features/shops/schema'
import { SKELETON_LOCATIONS, SKELETON_SETTINGS, SKELETON_SHOPS } from './skeleton-data'

const unique = <T>(values: readonly T[]) => new Set(values).size === values.length

describe('içerik iskeleti verisi', () => {
  it('8 dükkan ve 3 mekan/bölge: Çarşı ve Iyaş bölge, Black Garden mekan', () => {
    expect(SKELETON_SHOPS).toHaveLength(8)
    expect(SKELETON_LOCATIONS.map((l) => [l.slug, l.kind])).toEqual([
      ['carsi', 'DISTRICT'],
      ['iyas', 'DISTRICT'],
      ['black-garden', 'VENUE'],
    ])
  })

  it('slug ve sıra numaraları kendi grubunda benzersizdir', () => {
    expect(unique(SKELETON_LOCATIONS.map((l) => l.slug))).toBe(true)
    expect(unique(SKELETON_LOCATIONS.map((l) => l.sortOrder))).toBe(true)
    expect(unique(SKELETON_SHOPS.map((s) => s.slug))).toBe(true)
    expect(unique(SKELETON_SHOPS.map((s) => s.sortOrder))).toBe(true)
  })

  it('her dükkanın mekanı iskelette vardır; yalnızca Lulu Kafe bağımsızdır', () => {
    const locationSlugs = new Set<string>(SKELETON_LOCATIONS.map((l) => l.slug))
    const independent = SKELETON_SHOPS.filter((s) => s.locationSlug === null).map((s) => s.slug)
    expect(independent).toEqual(['lulu-kafe'])
    for (const shop of SKELETON_SHOPS) {
      if (shop.locationSlug !== null) expect(locationSlugs.has(shop.locationSlug)).toBe(true)
    }
    // Şubeli üç marka her iki bölgede de var; Garden'ın dükkanları iskelete girmez.
    const typesIn = (district: string) =>
      SKELETON_SHOPS.filter((s) => s.locationSlug === district).map((s) => s.type)
    expect(typesIn('carsi')).toEqual(['PLAYSTATION', 'INTERNET_CAFE', 'FOOD', 'APART'])
    expect(typesIn('iyas')).toEqual(['PLAYSTATION', 'INTERNET_CAFE', 'FOOD'])
    expect(SKELETON_SHOPS.some((s) => (s.locationSlug as string | null) === 'black-garden')).toBe(
      false,
    )
  })

  it('panel formlarının doğrulamasından geçer (ad, slug, tür, sıra; ayar metin uzunlukları)', () => {
    const shopShape = shopFormSchema.pick({ name: true, slug: true, type: true, sortOrder: true })
    for (const shop of SKELETON_SHOPS) expect(shopShape.safeParse(shop).success).toBe(true)
    const locationShape = locationFormSchema.pick({
      name: true,
      slug: true,
      kind: true,
      sortOrder: true,
    })
    for (const loc of SKELETON_LOCATIONS) expect(locationShape.safeParse(loc).success).toBe(true)
    const settingsShape = siteSettingsSchema.pick({
      brandName: true,
      heroTitle: true,
      heroSubtitle: true,
    })
    expect(settingsShape.safeParse(SKELETON_SETTINGS).success).toBe(true)
  })

  it('iskelet uydurma ayrıntı taşımaz: telefon, adres, açıklama, fiyat alanı yoktur', () => {
    const allowedShopKeys = ['slug', 'name', 'type', 'locationSlug', 'sortOrder']
    for (const shop of SKELETON_SHOPS) expect(Object.keys(shop)).toEqual(allowedShopKeys)
    const allowedLocationKeys = ['slug', 'name', 'kind', 'sortOrder']
    for (const loc of SKELETON_LOCATIONS) expect(Object.keys(loc)).toEqual(allowedLocationKeys)
    expect(Object.keys(SKELETON_SETTINGS)).toEqual(['brandName', 'heroTitle', 'heroSubtitle'])
  })
})
