import 'server-only'
import { cache } from 'react'
import { activeCampaignWhere } from '@/features/campaigns/active'
import { exceptionDateFilter, MAX_EXCEPTIONS } from '@/features/hours'
import { publicShopWhere, shopCardInclude } from '@/features/shops/queries'
import type { Prisma } from '@/generated/prisma/client'
import { db } from '@/lib/db'

/** Sitede görünen mekan: yayında ve çöp kutusunda değil. */
export const publicLocationWhere = {
  isActive: true,
  deletedAt: null,
} satisfies Prisma.LocationWhereInput

export const locationCardInclude = {
  coverImage: true,
  _count: { select: { shops: { where: publicShopWhere } } },
} satisfies Prisma.LocationInclude

export type LocationCardData = Prisma.LocationGetPayload<{ include: typeof locationCardInclude }>

export async function getActiveLocations(): Promise<LocationCardData[]> {
  return db.location.findMany({
    where: publicLocationWhere,
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: locationCardInclude,
  })
}

export async function getActiveLocationSlugs(): Promise<string[]> {
  const rows = await db.location.findMany({ where: publicLocationWhere, select: { slug: true } })
  return rows.map((r) => r.slug)
}

function locationDetailInclude(now: Date) {
  return {
    coverImage: true,
    hours: true,
    hoursExceptions: {
      where: { date: exceptionDateFilter(now) },
      orderBy: { date: 'asc' },
      take: MAX_EXCEPTIONS,
    },
    gallery: { include: { media: true }, orderBy: { sortOrder: 'asc' } },
    shops: {
      where: publicShopWhere,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: shopCardInclude(now),
    },
    campaigns: {
      where: activeCampaignWhere(now),
      include: { image: true },
      orderBy: { sortOrder: 'asc' },
    },
  } satisfies Prisma.LocationInclude
}

export type LocationDetail = Prisma.LocationGetPayload<{
  include: ReturnType<typeof locationDetailInclude>
}>

export const getLocationBySlug = cache(
  async (slug: string, now: Date = new Date()): Promise<LocationDetail | null> => {
    return db.location.findFirst({
      where: { slug, ...publicLocationWhere },
      include: locationDetailInclude(now),
    })
  },
)
