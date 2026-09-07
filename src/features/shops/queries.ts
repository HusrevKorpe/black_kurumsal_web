import 'server-only'
import { cache } from 'react'
import { activeCampaignWhere } from '@/features/campaigns/active'
import type { Prisma } from '@/generated/prisma/client'
import { db } from '@/lib/db'

/** Liste kartları için: kapak, mekan ve saatler (açık/kapalı rozeti için). */
export const shopCardInclude = {
  coverImage: true,
  hours: true,
  location: { select: { id: true, slug: true, name: true, kind: true, hours: true } },
} satisfies Prisma.ShopInclude

export type ShopCardData = Prisma.ShopGetPayload<{ include: typeof shopCardInclude }>

export async function getActiveShops(): Promise<ShopCardData[]> {
  return db.shop.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: shopCardInclude,
  })
}

export async function getActiveShopSlugs(): Promise<string[]> {
  const rows = await db.shop.findMany({ where: { isActive: true }, select: { slug: true } })
  return rows.map((r) => r.slug)
}

function shopDetailInclude(now: Date) {
  return {
    coverImage: true,
    logoImage: true,
    hours: true,
    location: {
      include: {
        hours: true,
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

/** Yalnızca aktif dükkan; pasif veya yoksa null (sayfa 404 verir). */
export const getShopBySlug = cache(
  async (slug: string, now: Date = new Date()): Promise<ShopDetail | null> => {
    return db.shop.findFirst({ where: { slug, isActive: true }, include: shopDetailInclude(now) })
  },
)
