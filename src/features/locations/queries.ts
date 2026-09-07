import 'server-only'
import { cache } from 'react'
import { activeCampaignWhere } from '@/features/campaigns/active'
import { shopCardInclude } from '@/features/shops/queries'
import type { Prisma } from '@/generated/prisma/client'
import { db } from '@/lib/db'

export const locationCardInclude = {
  coverImage: true,
  _count: { select: { shops: { where: { isActive: true } } } },
} satisfies Prisma.LocationInclude

export type LocationCardData = Prisma.LocationGetPayload<{ include: typeof locationCardInclude }>

export async function getActiveLocations(): Promise<LocationCardData[]> {
  return db.location.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: locationCardInclude,
  })
}

export async function getActiveLocationSlugs(): Promise<string[]> {
  const rows = await db.location.findMany({ where: { isActive: true }, select: { slug: true } })
  return rows.map((r) => r.slug)
}

function locationDetailInclude(now: Date) {
  return {
    coverImage: true,
    hours: true,
    gallery: { include: { media: true }, orderBy: { sortOrder: 'asc' } },
    shops: {
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: shopCardInclude,
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
      where: { slug, isActive: true },
      include: locationDetailInclude(now),
    })
  },
)
