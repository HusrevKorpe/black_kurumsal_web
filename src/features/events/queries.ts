import 'server-only'
import { db } from '@/lib/db'

export interface PublicEvent {
  id: string
  title: string
  description: string | null
  /** ISO; istemci bileşenine düz veri gider. */
  startsAt: string
  endsAt: string | null
  shop: { slug: string; name: string } | null
}

const DAY = 24 * 60 * 60 * 1000

/**
 * Ana sayfa takvimi: geçen aydan ~6 ay ilerisine kadar yayındaki etkinlikler. Sayfa saatte bir
 * yenilendiği için "bugün" istemcide hesaplanır; burada pencere geniş tutulur.
 */
export async function getCalendarEvents(now: Date = new Date()): Promise<PublicEvent[]> {
  const from = new Date(now.getTime() - 45 * DAY)
  const to = new Date(now.getTime() + 190 * DAY)
  const rows = await db.calendarEvent.findMany({
    where: {
      isActive: true,
      startsAt: { lte: to },
      OR: [{ startsAt: { gte: from } }, { endsAt: { gte: from } }],
      // Silinen ya da yayından kalkan dükkanın etkinliği bağlantısı 404'e gideceği için düşer.
      AND: [{ OR: [{ shopId: null }, { shop: { deletedAt: null, isActive: true } }] }],
    },
    orderBy: { startsAt: 'asc' },
    select: {
      id: true,
      title: true,
      description: true,
      startsAt: true,
      endsAt: true,
      shop: { select: { slug: true, name: true } },
    },
    take: 200,
  })
  return rows.map((e) => ({
    ...e,
    startsAt: e.startsAt.toISOString(),
    endsAt: e.endsAt?.toISOString() ?? null,
  }))
}
