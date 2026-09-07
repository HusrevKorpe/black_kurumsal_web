import 'server-only'
import type { Prisma } from '@/generated/prisma/client'
import { db } from '@/lib/db'

export const adminLocationListInclude = {
  coverImage: { select: { bucket: true, path: true, alt: true } },
  _count: { select: { shops: true, gallery: true } },
} satisfies Prisma.LocationInclude

export type AdminLocationListItem = Prisma.LocationGetPayload<{
  include: typeof adminLocationListInclude
}>

export async function listLocationsForAdmin(): Promise<AdminLocationListItem[]> {
  return db.location.findMany({
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: adminLocationListInclude,
  })
}

export const adminLocationInclude = {
  hours: true,
  coverImage: true,
  _count: { select: { shops: true } },
} satisfies Prisma.LocationInclude

export type AdminLocation = Prisma.LocationGetPayload<{ include: typeof adminLocationInclude }>

export async function getLocationForAdmin(id: string): Promise<AdminLocation | null> {
  return db.location.findUnique({ where: { id }, include: adminLocationInclude })
}

export async function getLocationGalleryForAdmin(locationId: string) {
  return db.galleryImage.findMany({
    where: { locationId },
    orderBy: { sortOrder: 'asc' },
    include: { media: true },
  })
}
