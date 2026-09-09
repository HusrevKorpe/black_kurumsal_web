import 'server-only'
import { cache } from 'react'
import { activeCampaignWhere } from '@/features/campaigns/active'
import { exceptionDateFilter, MAX_EXCEPTIONS } from '@/features/hours'
import type { Prisma } from '@/generated/prisma/client'
import { db } from '@/lib/db'

/** Sitede görünen dükkan: yayında ve çöp kutusunda değil. */
export const publicShopWhere = { isActive: true, deletedAt: null } satisfies Prisma.ShopWhereInput

/** Geçmiş istisnalar sorguda elenir; sayfa yükü birkaç satırda kalır. */
function exceptionsArgs(now: Date) {
  return {
    where: { date: exceptionDateFilter(now) },
    orderBy: { date: 'asc' },
    take: MAX_EXCEPTIONS,
  } satisfies Prisma.Shop$hoursExceptionsArgs
}

/** Liste kartları için: kapak, mekan ve saatler (açık/kapalı rozeti için). */
export function shopCardInclude(now: Date) {
  return {
    coverImage: true,
    hours: true,
    hoursExceptions: exceptionsArgs(now),
    location: {
      select: {
        id: true,
        slug: true,
        name: true,
        kind: true,
        hours: true,
        hoursExceptions: exceptionsArgs(now),
      },
    },
  } satisfies Prisma.ShopInclude
}

export type ShopCardData = Prisma.ShopGetPayload<{ include: ReturnType<typeof shopCardInclude> }>

export async function getActiveShops(now: Date = new Date()): Promise<ShopCardData[]> {
  return db.shop.findMany({
    where: publicShopWhere,
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: shopCardInclude(now),
  })
}

export async function getActiveShopSlugs(): Promise<string[]> {
  const rows = await db.shop.findMany({ where: publicShopWhere, select: { slug: true } })
  return rows.map((r) => r.slug)
}

function shopDetailInclude(now: Date) {
  return {
    coverImage: true,
    hours: true,
    hoursExceptions: exceptionsArgs(now),
    location: {
      include: {
        hours: true,
        hoursExceptions: exceptionsArgs(now),
        campaigns: {
          where: activeCampaignWhere(now),
          include: { image: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    },
    gallery: { include: { media: true }, orderBy: { sortOrder: 'asc' } },
    priceCategories: {
      where: { isActive: true },
      orderBy: { sortOrder: 'asc' },
      include: { items: { orderBy: { sortOrder: 'asc' }, include: { image: true } } },
    },
    campaigns: {
      where: activeCampaignWhere(now),
      include: { image: true },
      orderBy: { sortOrder: 'asc' },
    },
  } satisfies Prisma.ShopInclude
}

export type ShopDetail = Prisma.ShopGetPayload<{ include: ReturnType<typeof shopDetailInclude> }>

/** Yalnızca aktif dükkan; pasif, silinmiş veya yoksa null (sayfa 404 verir). */
export const getShopBySlug = cache(
  async (slug: string, now: Date = new Date()): Promise<ShopDetail | null> => {
    return db.shop.findFirst({
      where: { slug, ...publicShopWhere },
      include: shopDetailInclude(now),
    })
  },
)
