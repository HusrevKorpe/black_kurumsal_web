import type { ShopType } from '@/generated/prisma/enums'
import { SHOP_CATEGORIES, categoryOf, type ShopCategory } from '@/lib/constants/shops'

export interface ShopGroup<T> {
  key: ShopCategory
  label: string
  description: string
  anchorId: string
  shops: T[]
}

export function categoryAnchorId(key: ShopCategory): string {
  return `kategori-${key.toLowerCase()}`
}

/** Dükkanları kategori sırasına göre gruplar; boş kategoriler listeye girmez. */
export function groupShopsByCategory<T extends { type: ShopType }>(
  shops: readonly T[],
): ShopGroup<T>[] {
  return SHOP_CATEGORIES.map((category) => ({
    key: category.key,
    label: category.label,
    description: category.description,
    anchorId: categoryAnchorId(category.key),
    shops: shops.filter((shop) => categoryOf(shop.type) === category.key),
  })).filter((group) => group.shops.length > 0)
}
