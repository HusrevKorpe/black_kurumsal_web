import type { LocationKind, ShopType } from '@/generated/prisma/enums'

/**
 * Gerçek içerik iskeleti: markanın mekan/bölge ve dükkan yapısı (ad, adres/slug, tür, bağ, sıra).
 * Telefon, adres, saat, fiyat, açıklama ve görsel gibi ayrıntılar burada YOKTUR; onlar panelden girilir
 * (uydurma bilgi açık siteye çıkmasın). Canlı kurulumda `pnpm content:init` bu iskeleti açar; yerel seed ve
 * `pnpm content:demo` aynı iskeleti demo verisiyle doldurur (`demo-data.ts`). Tek doğruluk kaynağı burasıdır.
 */
export interface SkeletonLocation {
  slug: string
  name: string
  kind: LocationKind
  sortOrder: number
}

export const SKELETON_LOCATIONS = [
  { slug: 'carsi', name: 'Çarşı', kind: 'DISTRICT', sortOrder: 1 },
  { slug: 'iyas', name: 'Iyaş', kind: 'DISTRICT', sortOrder: 2 },
  /** İçinde birden çok dükkan olan mekan; ağaçta tek uçtur, dükkanları kendi sayfasında listelenir. */
  { slug: 'black-garden', name: 'Black Garden', kind: 'VENUE', sortOrder: 3 },
] as const satisfies readonly SkeletonLocation[]

export type SkeletonLocationSlug = (typeof SKELETON_LOCATIONS)[number]['slug']

export interface SkeletonShop {
  slug: string
  name: string
  type: ShopType
  /** null: bölgesi olmayan bağımsız dükkan (Lulu Kafe). */
  locationSlug: SkeletonLocationSlug | null
  sortOrder: number
}

/**
 * Patronun listesi (2026-11-04): PlayStation, Espor ve Tost'un Çarşı ve Iyaş şubeleri, Black Garden,
 * Lulu Kafe; Lavinya Apart Çarşı'da. Black Garden bir dükkan değil mekandır (yukarıda); içindeki dükkanlar
 * bilgileri gelince panelden "Black Garden" mekanına bağlanarak açılır, iskelete girmez.
 */
export const SKELETON_SHOPS = [
  {
    slug: 'black-playstation-carsi',
    name: 'Black PlayStation Çarşı',
    type: 'PLAYSTATION',
    locationSlug: 'carsi',
    sortOrder: 1,
  },
  {
    slug: 'black-espor-carsi',
    name: 'Black Espor Çarşı',
    type: 'INTERNET_CAFE',
    locationSlug: 'carsi',
    sortOrder: 2,
  },
  {
    slug: 'black-tost-carsi',
    name: 'Black Tost Çarşı',
    type: 'FOOD',
    locationSlug: 'carsi',
    sortOrder: 3,
  },
  {
    slug: 'lavinya-apart',
    name: 'Lavinya Apart',
    type: 'APART',
    locationSlug: 'carsi',
    sortOrder: 4,
  },
  {
    slug: 'black-playstation-iyas',
    name: 'Black PlayStation Iyaş',
    type: 'PLAYSTATION',
    locationSlug: 'iyas',
    sortOrder: 5,
  },
  {
    slug: 'black-espor-iyas',
    name: 'Black Espor Iyaş',
    type: 'INTERNET_CAFE',
    locationSlug: 'iyas',
    sortOrder: 6,
  },
  {
    slug: 'black-tost-iyas',
    name: 'Black Tost Iyaş',
    type: 'FOOD',
    locationSlug: 'iyas',
    sortOrder: 7,
  },
  {
    slug: 'lulu-kafe',
    name: 'Lulu Kafe',
    type: 'FOOD',
    locationSlug: null,
    sortOrder: 8,
  },
] as const satisfies readonly SkeletonShop[]

export type SkeletonShopSlug = (typeof SKELETON_SHOPS)[number]['slug']

/** Ana sayfa metinleri: yalnızca sitenin ne sunduğunu söyler; iletişim ve sosyal bağlantılar panelden. */
export const SKELETON_SETTINGS = {
  brandName: 'Black',
  heroTitle: 'Black dükkanları tek adreste',
  heroSubtitle:
    'PlayStation, espor, yeme-içme ve apart. Çalışma saatleri, fiyat listeleri ve iletişim bilgileri burada.',
} as const
