import type { Media, PriceCategory, PriceItem } from '@/generated/prisma/client'

/** Decimal, Client Component'e taşınamaz; sınırda string'e çevrilir. */
export interface PriceItemView {
  id: string
  name: string
  description: string | null
  price: string | null
  unit: string | null
  isAvailable: boolean
  isFeatured: boolean
  image: Pick<Media, 'bucket' | 'path' | 'alt' | 'width' | 'height'> | null
}

export interface PriceCategoryView {
  id: string
  name: string
  description: string | null
  isActive: boolean
  items: PriceItemView[]
}

type ItemWithImage = PriceItem & { image: Media | null }
type CategoryWithItems = PriceCategory & { items: ItemWithImage[] }

export function toPriceItemView(item: ItemWithImage): PriceItemView {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price === null ? null : item.price.toString(),
    unit: item.unit,
    isAvailable: item.isAvailable,
    isFeatured: item.isFeatured,
    image: item.image
      ? {
          bucket: item.image.bucket,
          path: item.image.path,
          alt: item.image.alt,
          width: item.image.width,
          height: item.image.height,
        }
      : null,
  }
}

export function toPriceCategoryViews(categories: CategoryWithItems[]): PriceCategoryView[] {
  return categories.map((category) => ({
    id: category.id,
    name: category.name,
    description: category.description,
    isActive: category.isActive,
    items: category.items.map(toPriceItemView),
  }))
}
