import 'server-only'
import { exceptionDateFilter, MAX_EXCEPTIONS } from '@/features/hours'
import type { Prisma } from '@/generated/prisma/client'
import { accessibleShopFilter, assertShopAccess, type StaffContext } from '@/lib/auth/authorize'
import { db } from '@/lib/db'

/** Silinmemiş dükkan: panelde yalnızca bunlar listelenir ve düzenlenir. */
export const notDeletedShopWhere = { deletedAt: null } satisfies Prisma.ShopWhereInput

export const adminShopListInclude = {
  coverImage: { select: { bucket: true, path: true, alt: true } },
  location: { select: { id: true, name: true, kind: true } },
  _count: { select: { gallery: true, priceCategories: true, campaigns: true } },
} satisfies Prisma.ShopInclude

export type AdminShopListItem = Prisma.ShopGetPayload<{ include: typeof adminShopListInclude }>

/** Patron: tüm dükkanlar. Sorumlu: atandığı dükkanlar. Pasifler de listelenir, silinenler değil. */
export async function listShopsForStaff(staff: StaffContext): Promise<AdminShopListItem[]> {
  return db.shop.findMany({
    where: { ...accessibleShopFilter(staff), ...notDeletedShopWhere },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: adminShopListInclude,
  })
}

export function adminShopInclude(now: Date) {
  const exceptions = {
    where: { date: exceptionDateFilter(now) },
    orderBy: { date: 'asc' },
    take: MAX_EXCEPTIONS,
  } as const
  return {
    location: {
      select: {
        id: true,
        name: true,
        kind: true,
        hours: true,
        hoursExceptions: exceptions,
      },
    },
    hours: true,
    hoursExceptions: exceptions,
    coverImage: true,
  } satisfies Prisma.ShopInclude
}

export type AdminShop = Prisma.ShopGetPayload<{ include: ReturnType<typeof adminShopInclude> }>

/** Erişim yoksa veya dükkan çöp kutusundaysa null (sayfa 404 verir; varlığı sızdırılmaz). */
export async function getShopForAdmin(
  staff: StaffContext,
  shopId: string,
  now: Date = new Date(),
): Promise<AdminShop | null> {
  try {
    assertShopAccess(staff, shopId)
  } catch {
    return null
  }
  return db.shop.findFirst({
    where: { id: shopId, ...notDeletedShopWhere },
    include: adminShopInclude(now),
  })
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
    where: { isActive: true, deletedAt: null },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true, kind: true },
  })
}
