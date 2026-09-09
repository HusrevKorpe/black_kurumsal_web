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
  { slug: 'black-garden', name: 'Black Garden', kind: 'VENUE', sortOrder: 1 },
  { slug: 'carsi', name: 'Çarşı', kind: 'DISTRICT', sortOrder: 2 },
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
    slug: 'black-tost-carsi',
    name: 'Black Tost Çarşı',
    type: 'FOOD',
    locationSlug: 'carsi',
    sortOrder: 2,
  },
  {
    slug: 'black-tavuk-garden',
    name: 'Black Tavuk',
    type: 'FOOD',
    locationSlug: 'black-garden',
    sortOrder: 3,
  },
  {
    slug: 'black-makarna-garden',
    name: 'Black Makarna',
    type: 'FOOD',
    locationSlug: 'black-garden',
    sortOrder: 4,
  },
  {
    slug: 'lavinya-apart',
    name: 'Lavinya Apart',
    type: 'APART',
    locationSlug: null,
    sortOrder: 5,
  },
] as const satisfies readonly SkeletonShop[]

export type SkeletonShopSlug = (typeof SKELETON_SHOPS)[number]['slug']

/** Ana sayfa metinleri: yalnızca sitenin ne sunduğunu söyler; iletişim ve sosyal bağlantılar panelden. */
export const SKELETON_SETTINGS = {
  brandName: 'Black',
  heroTitle: 'Black dükkanları tek adreste',
  heroSubtitle:
    'PlayStation kafe, yeme-içme ve apart. Çalışma saatleri, fiyat listeleri ve iletişim bilgileri burada.',
} as const
