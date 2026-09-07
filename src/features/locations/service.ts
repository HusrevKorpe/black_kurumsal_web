import 'server-only'
import { logAudit } from '@/features/audit/log'
import { removeObjects } from '@/features/media/storage'
import type { Location } from '@/generated/prisma/client'
import { fail, fromZodError, ok, type ActionResult } from '@/lib/actions/result'
import { assertOwner, type StaffContext } from '@/lib/auth/authorize'
import { db } from '@/lib/db'
import { tr } from '@/lib/i18n/tr'
import { locationFormSchema } from './schema'

export async function createLocation(
  staff: StaffContext,
  input: unknown,
): Promise<ActionResult<Location>> {
  assertOwner(staff)
  const parsed = locationFormSchema.safeParse(input)
  if (!parsed.success) return fromZodError(parsed.error)
  const location = await db.$transaction(async (tx) => {
    const created = await tx.location.create({ data: parsed.data })
    await logAudit(tx, {
      staffId: staff.id,
      action: 'location.create',
      entityType: 'Location',
      entityId: created.id,
      summary: `${created.name} mekanı oluşturuldu`,
    })
    return created
  })
  return ok(location)
}

export async function updateLocation(
  staff: StaffContext,
  locationId: string,
  input: unknown,
): Promise<ActionResult<Location>> {
  assertOwner(staff)
  const parsed = locationFormSchema.safeParse(input)
  if (!parsed.success) return fromZodError(parsed.error)
  const location = await db.$transaction(async (tx) => {
    const updated = await tx.location.update({ where: { id: locationId }, data: parsed.data })
    await logAudit(tx, {
      staffId: staff.id,
      action: 'location.update',
      entityType: 'Location',
      entityId: locationId,
      summary: `${updated.name} bilgileri güncellendi`,
    })
    return updated
  })
  return ok(location)
}

export async function setLocationCover(
  staff: StaffContext,
  locationId: string,
  mediaId: string | null,
): Promise<ActionResult<null>> {
  assertOwner(staff)
  if (mediaId) {
    const media = await db.media.findUnique({ where: { id: mediaId }, select: { path: true } })
    if (!media || !media.path.startsWith(`location/${locationId}/`))
      return fail('Görsel bu mekana ait değil.')
  }
  await db.$transaction(async (tx) => {
    const location = await tx.location.update({
      where: { id: locationId },
      data: { coverImageId: mediaId },
    })
    await logAudit(tx, {
      staffId: staff.id,
      action: 'location.cover',
      entityType: 'Location',
      entityId: locationId,
      summary: `${location.name} kapak görseli değişti`,
    })
  })
  return ok(null)
}

/** İçinde dükkan varsa silinmez: dükkanlar sessizce bağımsız kalmasın, patron bilinçli taşısın. */
export async function deleteLocation(
  staff: StaffContext,
  locationId: string,
): Promise<ActionResult<null>> {
  assertOwner(staff)
  const shopCount = await db.shop.count({ where: { locationId } })
  if (shopCount > 0) return fail(tr.admin.locations.hasShops)

  const paths = await db.$transaction(async (tx) => {
    const location = await tx.location.findUnique({
      where: { id: locationId },
      select: {
        name: true,
        gallery: { select: { media: { select: { id: true, path: true } } } },
        campaigns: { select: { image: { select: { id: true, path: true } } } },
      },
    })
    if (!location) return []
    const media = [
      ...location.gallery.map((g) => g.media),
      ...location.campaigns.map((c) => c.image),
    ]
    await tx.location.delete({ where: { id: locationId } })
    if (media.length > 0)
      await tx.media.deleteMany({ where: { id: { in: media.map((m) => m.id) } } })
    await logAudit(tx, {
      staffId: staff.id,
      action: 'location.delete',
      entityType: 'Location',
      entityId: locationId,
      summary: `${location.name} mekanı silindi`,
    })
    return media.map((m) => m.path)
  })
  await removeObjects(paths)
  return ok(null)
}
