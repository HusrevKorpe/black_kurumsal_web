import 'server-only'
import type { Prisma } from '@/generated/prisma/client'
import { accessibleShopFilter, assertShopAccess, type StaffContext } from '@/lib/auth/authorize'
import { db } from '@/lib/db'

export const adminShopListInclude = {
  coverImage: { select: { bucket: true, path: true, alt: true } },
  location: { select: { id: true, name: true, kind: true } },
  _count: { select: { gallery: true, priceCategories: true, campaigns: true } },
} satisfies Prisma.ShopInclude

export type AdminShopListItem = Prisma.ShopGetPayload<{ include: typeof adminShopListInclude }>

/** Patron: tüm dükkanlar. Sorumlu: atandığı dükkanlar. Pasifler de listelenir. */
export async function listShopsForStaff(staff: StaffContext): Promise<AdminShopListItem[]> {
  return db.shop.findMany({
    where: accessibleShopFilter(staff),
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: adminShopListInclude,
  })
}

export const adminShopInclude = {
  location: { select: { id: true, name: true, kind: true, hours: true } },
  hours: true,
  coverImage: true,
  logoImage: true,
} satisfies Prisma.ShopInclude

export type AdminShop = Prisma.ShopGetPayload<{ include: typeof adminShopInclude }>

/** Erişim yoksa null (sayfa 404 verir; varlığı sızdırılmaz). */
export async function getShopForAdmin(
  staff: StaffContext,
  shopId: string,
): Promise<AdminShop | null> {
  try {
    assertShopAccess(staff, shopId)
  } catch {
    return null
  }
  return db.shop.findUnique({ where: { id: shopId }, include: adminShopInclude })
}

export async function getShopGalleryForAdmin(staff: StaffContext, shopId: string) {
  assertShopAccess(staff, shopId)
  return db.galleryImage.findMany({
    where: { shopId },
    orderBy: { sortOrder: 'asc' },
    include: { media: true },
  })
}

export async function getShopPricingForAdmin(staff: StaffContext, shopId: string) {
  assertShopAccess(staff, shopId)
  return db.priceCategory.findMany({
    where: { shopId },
    orderBy: { sortOrder: 'asc' },
    include: { items: { orderBy: { sortOrder: 'asc' }, include: { image: true } } },
  })
}

export interface LocationOption {
  id: string
  name: string
  kind: 'VENUE' | 'DISTRICT'
}

export async function listLocationOptions(): Promise<LocationOption[]> {
  return db.location.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, kind: true },
  })
}
