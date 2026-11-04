import { ShopType } from '@/generated/prisma/enums'

export type ShopCategory = 'ENTERTAINMENT' | 'FOOD' | 'ACCOMMODATION' | 'OTHER'

export interface ShopCategoryMeta {
  key: ShopCategory
  label: string
  description: string
}

export const SHOP_CATEGORIES: readonly ShopCategoryMeta[] = [
  {
    key: 'ENTERTAINMENT',
    label: 'Oyun ve Eğlence',
    description: 'PlayStation ve espor',
  },
  { key: 'FOOD', label: 'Yeme-İçme', description: 'Tost ve yeme-içme' },
  { key: 'ACCOMMODATION', label: 'Konaklama', description: 'Apart ve konaklama' },
  { key: 'OTHER', label: 'Diğer', description: 'Diğer hizmetler' },
]

/**
 * Dükkanın tabela ışığı: siyah cephe aynı, her tür kendi rengiyle yanar. Oyun mavi-mor neon,
 * yeme-içme markanın kehribarı, konaklama sakin buz beyazı. Değerler globals.css `[data-accent]`.
 */
export type ShopAccent = 'neon' | 'amber' | 'ice'

export interface ShopTypeMeta {
  label: string
  category: ShopCategory
  accent: ShopAccent
  /** Fiyat kaleminde varsayılan birim önerisi. */
  defaultUnit: string | null
}

export const SHOP_TYPE_META: Record<ShopType, ShopTypeMeta> = {
  [ShopType.PLAYSTATION]: {
    label: 'PlayStation Kafe',
    category: 'ENTERTAINMENT',
    accent: 'neon',
    defaultUnit: 'saat',
  },
  [ShopType.INTERNET_CAFE]: {
    label: 'Espor Salonu',
    category: 'ENTERTAINMENT',
    accent: 'neon',
    defaultUnit: 'saat',
  },
  [ShopType.FOOD]: {
    label: 'Yeme-İçme',
    category: 'FOOD',
    accent: 'amber',
    defaultUnit: 'porsiyon',
  },
  [ShopType.APART]: {
    label: 'Apart',
    category: 'ACCOMMODATION',
    accent: 'ice',
    defaultUnit: 'gece',
  },
  [ShopType.OTHER]: { label: 'Diğer', category: 'OTHER', accent: 'amber', defaultUnit: null },
}

export function categoryOf(type: ShopType): ShopCategory {
  return SHOP_TYPE_META[type].category
}

export function categoryLabel(key: ShopCategory): string {
  return SHOP_CATEGORIES.find((c) => c.key === key)?.label ?? key
}

export const SHOP_TYPE_OPTIONS = (Object.keys(SHOP_TYPE_META) as ShopType[]).map((value) => ({
  value,
  label: SHOP_TYPE_META[value].label,
}))
