import 'server-only'
import type { Prisma } from '@/generated/prisma/client'
import { isOwner, type StaffContext } from '@/lib/auth/authorize'
import { db } from '@/lib/db'

const eventInclude = {
  shop: { select: { id: true, slug: true, name: true } },
} satisfies Prisma.CalendarEventInclude

export type AdminEventData = Prisma.CalendarEventGetPayload<{ include: typeof eventInclude }>

function eventAccessWhere(staff: StaffContext): Prisma.CalendarEventWhereInput {
  return isOwner(staff) ? {} : { shopId: { in: [...staff.shopIds] } }
}

/** Yaklaşanlar önce (en yakın tarih başta), geçmişler sonda (en yenisi başta). */
export async function listEventsForStaff(
  staff: StaffContext,
  now: Date = new Date(),
): Promise<{ upcoming: AdminEventData[]; past: AdminEventData[] }> {
  const where = eventAccessWhere(staff)
  const [upcoming, past] = await Promise.all([
    db.calendarEvent.findMany({
      where: {
        ...where,
        OR: [{ startsAt: { gte: now } }, { endsAt: { gte: now } }],
      },
      orderBy: { startsAt: 'asc' },
      include: eventInclude,
    }),
    db.calendarEvent.findMany({
      where: {
        ...where,
        startsAt: { lt: now },
        OR: [{ endsAt: null }, { endsAt: { lt: now } }],
      },
      orderBy: { startsAt: 'desc' },
      include: eventInclude,
      take: 30,
    }),
  ])
  return { upcoming, past }
}

export async function getEventForAdmin(
  staff: StaffContext,
  id: string,
): Promise<AdminEventData | null> {
  return db.calendarEvent.findFirst({
    where: { id, ...eventAccessWhere(staff) },
    include: eventInclude,
  })
}

/** Formdaki dükkan seçenekleri: sorumlu yalnızca kendi dükkanlarını görür. */
export async function listEventShops(staff: StaffContext): Promise<{ id: string; name: string }[]> {
  return db.shop.findMany({
    where: { ...(isOwner(staff) ? {} : { id: { in: [...staff.shopIds] } }), deletedAt: null },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: { id: true, name: true },
  })
}
