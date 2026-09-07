import 'server-only'
import { db } from '@/lib/db'

export interface TrashEntry {
  id: string
  name: string
  slug: string
  deletedAt: Date
  /** Kalıcı silinince gidecek içerik; onay ekranında sayı olarak gösterilir. */
  gallery: number
  extra: number
}

export interface TrashContents {
  shops: TrashEntry[]
  locations: TrashEntry[]
}

/**
 * Çöp kutusu yalnızca patrona açıktır (sayfa `requireOwner` ile korunur), bu yüzden
 * dükkan filtresi uygulanmaz: patron zaten hepsini görür.
 */
export async function getTrashContents(): Promise<TrashContents> {
  const [shops, locations] = await Promise.all([
    db.shop.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        deletedAt: true,
        _count: { select: { gallery: true, priceCategories: true } },
      },
    }),
    db.location.findMany({
      where: { deletedAt: { not: null } },
      orderBy: { deletedAt: 'desc' },
      select: {
        id: true,
        name: true,
        slug: true,
        deletedAt: true,
        _count: { select: { gallery: true, shops: true } },
      },
    }),
  ])

  return {
    shops: shops.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      deletedAt: s.deletedAt as Date,
      gallery: s._count.gallery,
      extra: s._count.priceCategories,
    })),
    locations: locations.map((l) => ({
      id: l.id,
      name: l.name,
      slug: l.slug,
      deletedAt: l.deletedAt as Date,
      gallery: l._count.gallery,
      extra: l._count.shops,
    })),
  }
}
