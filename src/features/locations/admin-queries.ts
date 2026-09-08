import 'server-only'
import { exceptionDateFilter, MAX_EXCEPTIONS } from '@/features/hours'
import type { Prisma } from '@/generated/prisma/client'
import { db } from '@/lib/db'

/** Silinmemiş mekan: panelde yalnızca bunlar listelenir ve düzenlenir. */
export const notDeletedLocationWhere = { deletedAt: null } satisfies Prisma.LocationWhereInput

export const adminLocationListInclude = {
  coverImage: { select: { bucket: true, path: true, alt: true } },
  _count: { select: { shops: { where: { deletedAt: null } }, gallery: true } },
} satisfies Prisma.LocationInclude

export type AdminLocationListItem = Prisma.LocationGetPayload<{
  include: typeof adminLocationListInclude
}>

export async function listLocationsForAdmin(): Promise<AdminLocationListItem[]> {
  return db.location.findMany({
    where: notDeletedLocationWhere,
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    include: adminLocationListInclude,
  })
}

export function adminLocationInclude(now: Date) {
  return {
    hours: true,
    hoursExceptions: {
      where: { date: exceptionDateFilter(now) },
      orderBy: { date: 'asc' },
      take: MAX_EXCEPTIONS,
    },
    coverImage: true,
    /** Silinmiş dükkanlar sayılmaz: mekanın silinebilirliği canlı dükkanlara bakar. */
    _count: { select: { shops: { where: { deletedAt: null } } } },
  } satisfies Prisma.LocationInclude
}

export type AdminLocation = Prisma.LocationGetPayload<{
  include: ReturnType<typeof adminLocationInclude>
}>

export async function getLocationForAdmin(
  id: string,
  now: Date = new Date(),
): Promise<AdminLocation | null> {
  return db.location.findFirst({
    where: { id, ...notDeletedLocationWhere },
    include: adminLocationInclude(now),
  })
}

export async function getLocationGalleryForAdmin(locationId: string) {
  return db.galleryImage.findMany({
    where: { locationId },
    orderBy: { sortOrder: 'asc' },
    include: { media: true },
  })
}
