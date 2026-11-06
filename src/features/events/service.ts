import 'server-only'
import { logAudit } from '@/features/audit/log'
import type { CalendarEvent } from '@/generated/prisma/client'
import { fail, fromZodError, ok, type ActionResult } from '@/lib/actions/result'
import { AuthorizationError, canAccessShop, isOwner, type StaffContext } from '@/lib/auth/authorize'
import { db } from '@/lib/db'
import { eventFormSchema, type EventFormInput } from './schema'

/** Genel (dükkansız) etkinliği yalnız patron yönetir; sorumlu yalnız kendi dükkanınınkini. */
function assertEventShop(staff: StaffContext, shopId: string | null): void {
  if (isOwner(staff)) return
  if (!shopId || !canAccessShop(staff, shopId)) throw new AuthorizationError()
}

function toData(data: EventFormInput) {
  return {
    title: data.title,
    description: data.description,
    shopId: data.shopId,
    startsAt: data.startsAt,
    endsAt: data.endsAt,
    isActive: data.isActive,
  }
}

export async function createEvent(
  staff: StaffContext,
  input: unknown,
): Promise<ActionResult<CalendarEvent>> {
  const parsed = eventFormSchema.safeParse(input)
  if (!parsed.success) return fromZodError(parsed.error)
  assertEventShop(staff, parsed.data.shopId)

  const event = await db.$transaction(async (tx) => {
    const created = await tx.calendarEvent.create({
      data: { ...toData(parsed.data), createdById: staff.id },
    })
    await logAudit(tx, {
      staffId: staff.id,
      action: 'event.create',
      entityType: 'CalendarEvent',
      entityId: created.id,
      summary: `"${created.title}" etkinliği oluşturuldu`,
    })
    return created
  })
  return ok(event)
}

export async function updateEvent(
  staff: StaffContext,
  eventId: string,
  input: unknown,
): Promise<ActionResult<CalendarEvent>> {
  const existing = await db.calendarEvent.findUnique({
    where: { id: eventId },
    select: { shopId: true },
  })
  if (!existing) return fail('Etkinlik bulunamadı.')
  assertEventShop(staff, existing.shopId)

  const parsed = eventFormSchema.safeParse(input)
  if (!parsed.success) return fromZodError(parsed.error)
  assertEventShop(staff, parsed.data.shopId)

  const updated = await db.$transaction(async (tx) => {
    const result = await tx.calendarEvent.update({
      where: { id: eventId },
      data: toData(parsed.data),
    })
    await logAudit(tx, {
      staffId: staff.id,
      action: 'event.update',
      entityType: 'CalendarEvent',
      entityId: eventId,
      summary: `"${result.title}" etkinliği güncellendi`,
    })
    return result
  })
  return ok(updated)
}

export async function deleteEvent(
  staff: StaffContext,
  eventId: string,
): Promise<ActionResult<null>> {
  const existing = await db.calendarEvent.findUnique({
    where: { id: eventId },
    select: { title: true, shopId: true },
  })
  if (!existing) return fail('Etkinlik bulunamadı.')
  assertEventShop(staff, existing.shopId)

  await db.$transaction(async (tx) => {
    await tx.calendarEvent.delete({ where: { id: eventId } })
    await logAudit(tx, {
      staffId: staff.id,
      action: 'event.delete',
      entityType: 'CalendarEvent',
      entityId: eventId,
      summary: `"${existing.title}" etkinliği silindi`,
    })
  })
  return ok(null)
}
