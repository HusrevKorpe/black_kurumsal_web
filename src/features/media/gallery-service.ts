import 'server-only'
import { logAudit } from '@/features/audit/log'
import { fail, fromZodError, ok, type ActionResult } from '@/lib/actions/result'
import { assertOwner, assertShopAccess, type StaffContext } from '@/lib/auth/authorize'
import { db } from '@/lib/db'
import {
  addGalleryImagesSchema,
  captionSchema,
  reorderGallerySchema,
  type GalleryOwner,
} from './gallery-schema'
import { deleteMediaRow, removeObjects } from './service'

interface OwnerInfo {
  where: { shopId: string } | { locationId: string }
  pathPrefix: string
  entityType: 'Shop' | 'Location'
  entityId: string
  name: string
}

async function resolveOwner(staff: StaffContext, owner: GalleryOwner): Promise<OwnerInfo> {
  if (owner.shopId) {
    assertShopAccess(staff, owner.shopId)
    const shop = await db.shop.findUniqueOrThrow({
      where: { id: owner.shopId },
      select: { name: true },
    })
    return {
      where: { shopId: owner.shopId },
      pathPrefix: `shop/${owner.shopId}/`,
      entityType: 'Shop',
      entityId: owner.shopId,
      name: shop.name,
    }
  }
  assertOwner(staff)
  const locationId = owner.locationId as string
  const location = await db.location.findUniqueOrThrow({
    where: { id: locationId },
    select: { name: true },
  })
  return {
    where: { locationId },
    pathPrefix: `location/${locationId}/`,
    entityType: 'Location',
    entityId: locationId,
    name: location.name,
  }
}

/** Yüklenmiş medyaları galeriye ekler. Medya bu sahibe ait (yol öneki) ve daha önce eklenmemiş olmalı. */
export async function addGalleryImages(
  staff: StaffContext,
  input: unknown,
): Promise<ActionResult<{ count: number }>> {
  const parsed = addGalleryImagesSchema.safeParse(input)
  if (!parsed.success) return fromZodError(parsed.error)
  const owner = await resolveOwner(staff, parsed.data.owner)

  const media = await db.media.findMany({
    where: { id: { in: parsed.data.mediaIds } },
    select: { id: true, path: true, galleryImage: { select: { id: true } } },
  })
  if (media.length !== parsed.data.mediaIds.length) return fail('Bazı görseller bulunamadı.')
  if (media.some((m) => !m.path.startsWith(owner.pathPrefix)))
    return fail('Görsel bu kayda ait değil.')
  if (media.some((m) => m.galleryImage)) return fail('Görsel zaten galeride.')

  await db.$transaction(async (tx) => {
    const last = await tx.galleryImage.findFirst({
      where: owner.where,
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    })
    let next = (last?.sortOrder ?? -1) + 1
    await tx.galleryImage.createMany({
      data: parsed.data.mediaIds.map((mediaId) => ({ mediaId, ...owner.where, sortOrder: next++ })),
    })
    await logAudit(tx, {
      staffId: staff.id,
      action: 'gallery.add',
      entityType: owner.entityType,
      entityId: owner.entityId,
      summary: `${owner.name} galerisine ${parsed.data.mediaIds.length} görsel eklendi`,
    })
  })
  return ok({ count: parsed.data.mediaIds.length })
}

/** Galeri kaydını ve dosyasını siler. Kapak olarak kullanılıyorsa kapak otomatik boşalır. */
export async function removeGalleryImage(
  staff: StaffContext,
  galleryImageId: string,
): Promise<ActionResult<null>> {
  const image = await db.galleryImage.findUnique({
    where: { id: galleryImageId },
    select: { mediaId: true, shopId: true, locationId: true },
  })
  if (!image) return fail('Görsel bulunamadı.')
  const owner = await resolveOwner(staff, {
    shopId: image.shopId ?? undefined,
    locationId: image.locationId ?? undefined,
  })

  const path = await db.$transaction(async (tx) => {
    const removed = await deleteMediaRow(tx, image.mediaId)
    await logAudit(tx, {
      staffId: staff.id,
      action: 'gallery.remove',
      entityType: owner.entityType,
      entityId: owner.entityId,
      summary: `${owner.name} galerisinden görsel silindi`,
    })
    return removed
  })
  if (path) await removeObjects([path])
  return ok(null)
}

export async function reorderGallery(
  staff: StaffContext,
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = reorderGallerySchema.safeParse(input)
  if (!parsed.success) return fromZodError(parsed.error)
  const owner = await resolveOwner(staff, parsed.data.owner)

  const existing = await db.galleryImage.findMany({ where: owner.where, select: { id: true } })
  const existingIds = new Set(existing.map((e) => e.id))
  if (
    parsed.data.ids.length !== existingIds.size ||
    parsed.data.ids.some((id) => !existingIds.has(id))
  ) {
    return fail('Sıralama listesi güncel değil. Sayfayı yenileyin.')
  }

  await db.$transaction(
    parsed.data.ids.map((id, index) =>
      db.galleryImage.update({ where: { id }, data: { sortOrder: index } }),
    ),
  )
  return ok(null)
}

export async function updateGalleryCaption(
  staff: StaffContext,
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = captionSchema.safeParse(input)
  if (!parsed.success) return fromZodError(parsed.error)
  const image = await db.galleryImage.findUnique({
    where: { id: parsed.data.id },
    select: { shopId: true, locationId: true },
  })
  if (!image) return fail('Görsel bulunamadı.')
  await resolveOwner(staff, {
    shopId: image.shopId ?? undefined,
    locationId: image.locationId ?? undefined,
  })
  await db.galleryImage.update({
    where: { id: parsed.data.id },
    data: { caption: parsed.data.caption },
  })
  return ok(null)
}
