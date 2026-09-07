import type { LocationKind } from '@/generated/prisma/enums'
import { tr } from '@/lib/i18n/tr'

export interface ShopLocationRef {
  slug: string
  name: string
  kind: LocationKind
}

/** Kartlarda ve başlıkta gösterilen konum satırı: "Black Garden içinde" ya da "Çarşı". */
export function shopLocationLabel(location: ShopLocationRef | null | undefined): string {
  if (!location) return ''
  return location.kind === 'VENUE' ? tr.shop.insideVenue(location.name) : location.name
}
