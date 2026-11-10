import 'server-only'
import { cache } from 'react'
import type { ShopType } from '@/generated/prisma/enums'
import { publicLocationWhere } from '@/features/locations/queries'
import { db } from '@/lib/db'
import { ROUTES } from '@/lib/constants/routes'
import { tr } from '@/lib/i18n/tr'
import { publicShopWhere } from './queries'
import { isUnderRenovation } from './renovation'
import { buildShopTree } from './tree'

export interface NavShopLink {
  href: `/${string}`
  label: string
  /** Simge için: oyun, yemek, konaklama. Mekân satırında yok. */
  type: ShopType | null
  /** Adın yanındaki kısa not: "7 dükkan", "Tadilatta". */
  note: string | null
}

/** Menüdeki bir öbek: başlığı bölge (Çarşı) ya da başlıksız (mekân ve bağsız dükkanlar). */
export interface NavShopGroup {
  key: string
  title: { href: `/${string}`; label: string } | null
  links: NavShopLink[]
}

/**
 * Telefon menüsündeki dükkan rehberi: ana sayfadaki ağacın aynı sırası, yalnız ad ve bağlantı.
 * Ağaçla aynı kuralı kullanır (`buildShopTree`): mekân tek satır, bölge altında dükkanları.
 */
export const getNavShopGroups = cache(async (): Promise<NavShopGroup[]> => {
  const orderBy = [{ sortOrder: 'asc' as const }, { name: 'asc' as const }]
  const location = { select: { id: true, slug: true, name: true, kind: true } }
  const [shops, locations] = await Promise.all([
    db.shop.findMany({
      where: publicShopWhere,
      orderBy,
      select: { id: true, slug: true, name: true, type: true, location },
    }),
    db.location.findMany({
      where: publicLocationWhere,
      orderBy,
      select: { id: true, slug: true, name: true, kind: true },
    }),
  ])

  const shopLink = (shop: (typeof shops)[number]): NavShopLink => ({
    href: ROUTES.shop(shop.slug),
    label: shop.name,
    type: shop.type,
    note: isUnderRenovation(shop.slug) ? tr.renovation.badge : null,
  })

  const groups: NavShopGroup[] = []
  // Mekân ve bağsız dükkanlar başlıksız tek öbekte toplanır; ağaçtaki sıraları korunur.
  let loose: NavShopGroup | null = null
  for (const node of buildShopTree(shops, locations)) {
    if (node.kind === 'group') {
      groups.push({
        key: node.key,
        title: { href: ROUTES.location(node.location.slug), label: node.location.name },
        links: node.shops.map(shopLink),
      })
      loose = null
      continue
    }
    const link =
      node.kind === 'venue'
        ? {
            href: ROUTES.location(node.location.slug),
            label: node.location.name,
            type: null,
            note: node.shopCount > 0 ? tr.home.shopCount(node.shopCount) : null,
          }
        : shopLink(node.shop)
    if (!loose) {
      loose = { key: node.key, title: null, links: [] }
      groups.push(loose)
    }
    loose.links.push(link)
  }
  return groups
})
