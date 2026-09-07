import 'server-only'
import { logAudit } from '@/features/audit/log'
import { removeObjects } from '@/features/media/storage'
import type { Shop } from '@/generated/prisma/client'
import { fromZodError, ok, type ActionResult } from '@/lib/actions/result'
import { assertOwner, assertShopAccess, isOwner, type StaffContext } from '@/lib/auth/authorize'
import { db } from '@/lib/db'
import { managerShopFormSchema, shopFormSchema } from './schema'

export async function createShop(staff: StaffContext, input: unknown): Promise<ActionResult<Shop>> {
  assertOwner(staff)
  const parsed = shopFormSchema.safeParse(input)
  if (!parsed.success) return fromZodError(parsed.error)

  const shop = await db.$transaction(async (tx) => {
    const created = await tx.shop.create({ data: parsed.data })
    await logAudit(tx, {
      staffId: staff.id,
      action: 'shop.create',
      entityType: 'Shop',
      entityId: created.id,
      summary: `${created.name} dükkanı oluşturuldu`,
    })
    return created
  })
  return ok(shop)
}

/** Patron tüm alanları, sorumlu yalnızca içerik alanlarını değiştirir. */
export async function updateShop(
  staff: StaffContext,
  shopId: string,
  input: unknown,
): Promise<ActionResult<Shop>> {
  assertShopAccess(staff, shopId)
  const schema = isOwner(staff) ? shopFormSchema : managerShopFormSchema
  const parsed = schema.safeParse(input)
  if (!parsed.success) return fromZodError(parsed.error)

  const shop = await db.$transaction(async (tx) => {
    const updated = await tx.shop.update({ where: { id: shopId }, data: parsed.data })
    await logAudit(tx, {
      staffId: staff.id,
      action: 'shop.update',
      entityType: 'Shop',
      entityId: shopId,
      summary: `${updated.name} bilgileri güncellendi`,
      data: { fields: Object.keys(parsed.data) },
    })
    return updated
  })
  return ok(shop)
}

/** Kapak görseli dükkanın kendi medyası olmalı (yol: shop/<id>/…). null kapak kaldırır. */
export async function setShopCover(
  staff: StaffContext,
  shopId: string,
  mediaId: string | null,
): Promise<ActionResult<null>> {
  assertShopAccess(staff, shopId)
  if (mediaId) {
    const media = await db.media.findUnique({ where: { id: mediaId }, select: { path: true } })
    if (!media || !media.path.startsWith(`shop/${shopId}/`)) {
      return { ok: false, error: 'Görsel bu dükkana ait değil.' }
    }
  }
  await db.$transaction(async (tx) => {
    const shop = await tx.shop.update({ where: { id: shopId }, data: { coverImageId: mediaId } })
    await logAudit(tx, {
      staffId: staff.id,
      action: 'shop.cover',
      entityType: 'Shop',
      entityId: shopId,
      summary: mediaId
        ? `${shop.name} kapak görseli değişti`
        : `${shop.name} kapak görseli kaldırıldı`,
    })
  })
  return ok(null)
}

/**
 * Dükkanı ve ona bağlı her şeyi siler. Dosyalar DB işlemi bittikten sonra Storage'dan kaldırılır.
 * Yalnızca patron. Geri alınamaz; arayüz onay ister.
 */
export async function deleteShop(staff: StaffContext, shopId: string): Promise<ActionResult<null>> {
  assertOwner(staff)
  const paths = await db.$transaction(async (tx) => {
    const shop = await tx.shop.findUnique({
      where: { id: shopId },
      select: {
        name: true,
        gallery: { select: { media: { select: { id: true, path: true } } } },
        campaigns: { select: { image: { select: { id: true, path: true } } } },
        priceCategories: {
          select: { items: { select: { image: { select: { id: true, path: true } } } } },
        },
      },
    })
    if (!shop) return []
    const media = [
      ...shop.gallery.map((g) => g.media),
      ...shop.campaigns.map((c) => c.image),
      ...shop.priceCategories.flatMap((c) => c.items.flatMap((i) => (i.image ? [i.image] : []))),
    ]
    await tx.shop.delete({ where: { id: shopId } })
    if (media.length > 0)
      await tx.media.deleteMany({ where: { id: { in: media.map((m) => m.id) } } })
    await logAudit(tx, {
      staffId: staff.id,
      action: 'shop.delete',
      entityType: 'Shop',
      entityId: shopId,
      summary: `${shop.name} dükkanı silindi`,
    })
    return media.map((m) => m.path)
  })
  await removeObjects(paths)
  return ok(null)
}
