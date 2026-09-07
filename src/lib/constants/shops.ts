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
    description: 'PlayStation ve internet kafeler',
  },
  { key: 'FOOD', label: 'Yeme-İçme', description: 'Tost, tavuk, makarna, sushi' },
  { key: 'ACCOMMODATION', label: 'Konaklama', description: 'Apart ve konaklama' },
  { key: 'OTHER', label: 'Diğer', description: 'Diğer hizmetler' },
]

export interface ShopTypeMeta {
  label: string
  category: ShopCategory
  /** Fiyat kaleminde varsayılan birim önerisi. */
  defaultUnit: string | null
}

export const SHOP_TYPE_META: Record<ShopType, ShopTypeMeta> = {
  [ShopType.PLAYSTATION]: {
    label: 'PlayStation Kafe',
    category: 'ENTERTAINMENT',
    defaultUnit: 'saat',
  },
  [ShopType.INTERNET_CAFE]: {
    label: 'İnternet Kafe',
    category: 'ENTERTAINMENT',
    defaultUnit: 'saat',
  },
  [ShopType.FOOD]: { label: 'Yeme-İçme', category: 'FOOD', defaultUnit: 'porsiyon' },
  [ShopType.APART]: { label: 'Apart', category: 'ACCOMMODATION', defaultUnit: 'gece' },
  [ShopType.OTHER]: { label: 'Diğer', category: 'OTHER', defaultUnit: null },
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
