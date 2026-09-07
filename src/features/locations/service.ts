import 'server-only'
import { logAudit } from '@/features/audit/log'
import type { Location } from '@/generated/prisma/client'
import { fail, fromZodError, ok, type ActionResult } from '@/lib/actions/result'
import { assertOwner, type StaffContext } from '@/lib/auth/authorize'
import { db } from '@/lib/db'
import { tr } from '@/lib/i18n/tr'
import { locationFormSchema } from './schema'

/** Çöp kutusundaki mekan slug'ını korur; çakışma nereye bakılacağını söyleyen mesajla döner. */
async function slugHeldInTrash(slug: string): Promise<boolean> {
  const held = await db.location.count({ where: { slug, deletedAt: { not: null } } })
  return held > 0
}

export async function createLocation(
  staff: StaffContext,
  input: unknown,
): Promise<ActionResult<Location>> {
  assertOwner(staff)
  const parsed = locationFormSchema.safeParse(input)
  if (!parsed.success) return fromZodError(parsed.error)
  if (await slugHeldInTrash(parsed.data.slug)) return fail(tr.admin.locations.slugInTrash)
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
  if (await slugHeldInTrash(parsed.data.slug)) return fail(tr.admin.locations.slugInTrash)
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

/**
 * Mekanı çöp kutusuna alır: siteden ve panelden düşer, hiçbir şey silinmez. Geri alınabilir;
 * kalıcı silme çöp kutusundan yapılır (`features/trash`).
 * İçinde canlı dükkan varsa alınmaz: dükkanlar sessizce bağımsız kalmasın, patron bilinçli taşısın.
 */
export async function deleteLocation(
  staff: StaffContext,
  locationId: string,
): Promise<ActionResult<null>> {
  assertOwner(staff)
  const shopCount = await db.shop.count({ where: { locationId, deletedAt: null } })
  if (shopCount > 0) return fail(tr.admin.locations.hasShops)

  await db.$transaction(async (tx) => {
    const location = await tx.location.update({
      where: { id: locationId, deletedAt: null },
      data: { deletedAt: new Date() },
      select: { name: true },
    })
    await logAudit(tx, {
      staffId: staff.id,
      action: 'location.delete',
      entityType: 'Location',
      entityId: locationId,
      summary: `${location.name} mekanı çöp kutusuna alındı`,
    })
  })
  return ok(null)
}
