import type { LocationKind, ShopType } from '@/generated/prisma/enums'

/**
 * Gerçek içerik iskeleti: markanın mekan/bölge ve dükkan yapısı (ad, adres/slug, tür, bağ, sıra).
 * Telefon, adres, saat, fiyat, açıklama ve görsel gibi ayrıntılar burada YOKTUR; onlar panelden girilir
 * (uydurma bilgi açık siteye çıkmasın). Canlı kurulumda `pnpm content:init` bu iskeleti açar; yerel
 * seed aynı iskeleti demo verisiyle doldurur (`prisma/seed/data.ts`). Tek doğruluk kaynağı burasıdır.
 */
export interface SkeletonLocation {
  slug: string
  name: string
  kind: LocationKind
  sortOrder: number
}

export const SKELETON_LOCATIONS = [
  { slug: 'black-garden', name: 'Black Garden', kind: 'VENUE', sortOrder: 1 },
  { slug: 'carsi', name: 'Çarşı', kind: 'DISTRICT', sortOrder: 2 },
  { slug: 'iyas', name: 'Iyaş', kind: 'DISTRICT', sortOrder: 3 },
] as const satisfies readonly SkeletonLocation[]

export type SkeletonLocationSlug = (typeof SKELETON_LOCATIONS)[number]['slug']

export interface SkeletonShop {
  slug: string
  name: string
  type: ShopType
  /** null: bölgesi olmayan bağımsız dükkan (Lavinya Apart, Black markası taşımaz). */
  locationSlug: SkeletonLocationSlug | null
  sortOrder: number
}

export const SKELETON_SHOPS = [
  {
    slug: 'black-playstation-carsi',
    name: 'Black PlayStation Çarşı',
    type: 'PLAYSTATION',
    locationSlug: 'carsi',
    sortOrder: 1,
  },
  {
    slug: 'black-internet-kafe-carsi',
    name: 'Black İnternet Kafe Çarşı',
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
    slug: 'black-playstation-iyas',
    name: 'Black PlayStation Iyaş',
    type: 'PLAYSTATION',
    locationSlug: 'iyas',
    sortOrder: 4,
  },
  {
    slug: 'black-internet-kafe-iyas',
    name: 'Black İnternet Kafe Iyaş',
    type: 'INTERNET_CAFE',
    locationSlug: 'iyas',
    sortOrder: 5,
  },
  {
    slug: 'black-tost-iyas',
    name: 'Black Tost Iyaş',
    type: 'FOOD',
    locationSlug: 'iyas',
    sortOrder: 6,
  },
  {
    slug: 'black-tavuk-garden',
    name: 'Black Tavuk',
    type: 'FOOD',
    locationSlug: 'black-garden',
    sortOrder: 7,
  },
  {
    slug: 'black-makarna-garden',
    name: 'Black Makarna',
    type: 'FOOD',
    locationSlug: 'black-garden',
    sortOrder: 8,
  },
  {
    slug: 'black-tost-garden',
    name: 'Black Tost',
    type: 'FOOD',
    locationSlug: 'black-garden',
    sortOrder: 9,
  },
  {
    slug: 'black-sushi-garden',
    name: 'Black Sushi',
    type: 'FOOD',
    locationSlug: 'black-garden',
    sortOrder: 10,
  },
  {
    slug: 'lavinya-apart',
    name: 'Lavinya Apart',
    type: 'APART',
    locationSlug: null,
    sortOrder: 11,
  },
] as const satisfies readonly SkeletonShop[]

export type SkeletonShopSlug = (typeof SKELETON_SHOPS)[number]['slug']

/** Ana sayfa metinleri: yalnızca sitenin ne sunduğunu söyler; iletişim ve sosyal bağlantılar panelden. */
export const SKELETON_SETTINGS = {
  brandName: 'Black',
  heroTitle: 'Black dükkanları tek adreste',
  heroSubtitle:
    'PlayStation kafe, internet kafe, yeme-içme ve apart. Çalışma saatleri, fiyat listeleri ve iletişim bilgileri burada.',
} as const
