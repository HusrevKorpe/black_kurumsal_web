import 'server-only'
import { logAudit } from '@/features/audit/log'
import { fromZodError, ok, type ActionResult } from '@/lib/actions/result'
import { assertOwner, assertShopAccess, type StaffContext } from '@/lib/auth/authorize'
import { db } from '@/lib/db'
import { weeklyHoursSchema } from './schema'

/** Dükkan saatleri: useOwnHours=false → kendi kaydı silinir, mekan saatleri devralınır. */
export async function saveShopHours(
  staff: StaffContext,
  shopId: string,
  input: unknown,
): Promise<ActionResult<null>> {
  assertShopAccess(staff, shopId)
  const parsed = weeklyHoursSchema.safeParse(input)
  if (!parsed.success) return fromZodError(parsed.error)
  const { useOwnHours, days } = parsed.data

  await db.$transaction(async (tx) => {
    const shop = await tx.shop.findUniqueOrThrow({ where: { id: shopId }, select: { name: true } })
    await tx.openingHours.deleteMany({ where: { shopId } })
    if (useOwnHours) {
      await tx.openingHours.createMany({
        data: days.map((d) => ({
          shopId,
          dayOfWeek: d.dayOfWeek,
          isClosed: d.isClosed,
          opensAt: d.isClosed ? null : d.opensAt,
          closesAt: d.isClosed ? null : d.closesAt,
        })),
      })
    }
    await logAudit(tx, {
      staffId: staff.id,
      action: 'shop.hours',
      entityType: 'Shop',
      entityId: shopId,
      summary: useOwnHours
        ? `${shop.name} çalışma saatleri güncellendi`
        : `${shop.name} saatleri mekandan devralınıyor`,
    })
  })
  return ok(null)
}

/** Mekan saatleri (yalnızca patron). useOwnHours=false → saat yok. */
export async function saveLocationHours(
  staff: StaffContext,
  locationId: string,
  input: unknown,
): Promise<ActionResult<null>> {
  assertOwner(staff)
  const parsed = weeklyHoursSchema.safeParse(input)
  if (!parsed.success) return fromZodError(parsed.error)
  const { useOwnHours, days } = parsed.data

  await db.$transaction(async (tx) => {
    const location = await tx.location.findUniqueOrThrow({
      where: { id: locationId },
      select: { name: true },
    })
    await tx.openingHours.deleteMany({ where: { locationId } })
    if (useOwnHours) {
      await tx.openingHours.createMany({
        data: days.map((d) => ({
          locationId,
          dayOfWeek: d.dayOfWeek,
          isClosed: d.isClosed,
          opensAt: d.isClosed ? null : d.opensAt,
          closesAt: d.isClosed ? null : d.closesAt,
        })),
      })
    }
    await logAudit(tx, {
      staffId: staff.id,
      action: 'location.hours',
      entityType: 'Location',
      entityId: locationId,
      summary: `${location.name} çalışma saatleri güncellendi`,
    })
  })
  return ok(null)
}
