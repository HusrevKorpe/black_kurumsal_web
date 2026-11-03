import type { LocationKind } from '@/generated/prisma/enums'

interface TreeShop {
  id: string
  location: { id: string; slug: string; name: string; kind: LocationKind } | null
}

export type ShopTreeNode<T extends TreeShop> =
  | { kind: 'group'; key: string; location: NonNullable<T['location']>; shops: T[] }
  | { kind: 'shop'; key: string; shop: T }

/**
 * Açılış ağacının dalları: dükkanlar bağlı oldukları mekan/bölgenin altına girer, bağsız dükkan
 * doğrudan köke bağlanır. Sıra dükkan sırasından gelir; bir dalın yeri ilk dükkanının yeridir.
 * Hangi dükkanın görüneceğine sorgu karar verir (panelde "yayında" olanlar).
 */
export function buildShopTree<T extends TreeShop>(shops: readonly T[]): ShopTreeNode<T>[] {
  const nodes: ShopTreeNode<T>[] = []
  const groups = new Map<string, Extract<ShopTreeNode<T>, { kind: 'group' }>>()

  for (const shop of shops) {
    const location = shop.location as NonNullable<T['location']> | null
    if (!location) {
      nodes.push({ kind: 'shop', key: shop.id, shop })
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
  return nodes
}
