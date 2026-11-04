import type { LocationKind } from '@/generated/prisma/enums'

interface TreeLocation {
  id: string
  slug: string
  name: string
  kind: LocationKind
}

interface TreeShop {
  id: string
  location: TreeLocation | null
}

export type ShopTreeNode<T extends TreeShop, L extends TreeLocation = TreeLocation> =
  | { kind: 'group'; key: string; location: NonNullable<T['location']>; shops: T[] }
  | { kind: 'venue'; key: string; location: L; shopCount: number }
  | { kind: 'shop'; key: string; shop: T }

/**
 * Açılış ağacının dalları. Önce mekan/bölgeler gelir (verilen sırayla), sonra bağsız dükkanlar.
 *  - Bölge (DISTRICT): dal olur, dükkanları altında uç olarak açılır; dükkanı yoksa görünmez.
 *  - Mekan (VENUE, ör. Black Garden): tek uçtur, dükkanı olmasa da görünür. İçindeki dükkanlar
 *    ağaca girmez, mekanın kendi sayfasında listelenir.
 *  - Mekanı listede olmayan (ör. yayından kalkmış) dükkan eskisi gibi kendi mekanının dalına girer.
 * Hangi kaydın görüneceğine sorgu karar verir (panelde "yayında" olanlar).
 */
export function buildShopTree<T extends TreeShop, L extends TreeLocation>(
  shops: readonly T[],
  locations: readonly L[] = [],
): ShopTreeNode<T, L>[] {
  const nodes: ShopTreeNode<T, L>[] = []
  const groups = new Map<string, Extract<ShopTreeNode<T, L>, { kind: 'group' }>>()
  const venues = new Map<string, Extract<ShopTreeNode<T, L>, { kind: 'venue' }>>()

  for (const location of locations) {
    if (location.kind === 'VENUE') {
      const node = { kind: 'venue' as const, key: location.id, location, shopCount: 0 }
      venues.set(location.id, node)
      nodes.push(node)
    } else {
      const node = {
        kind: 'group' as const,
        key: location.id,
        location: location as unknown as NonNullable<T['location']>,
        shops: [] as T[],
      }
      groups.set(location.id, node)
      nodes.push(node)
    }
  }

  const loose: ShopTreeNode<T, L>[] = []
  for (const shop of shops) {
    const location = shop.location as NonNullable<T['location']> | null
    if (!location) {
      loose.push({ kind: 'shop', key: shop.id, shop })
      continue
    }
    const venue = venues.get(location.id)
    if (venue) {
      venue.shopCount += 1
      continue
    }
    const group = groups.get(location.id)
    if (group) {
      group.shops.push(shop)
    } else {
      const created = { kind: 'group' as const, key: location.id, location, shops: [shop] }
      groups.set(location.id, created)
      nodes.push(created)
    }
  }

  return [...nodes.filter((n) => n.kind !== 'group' || n.shops.length > 0), ...loose]
}
