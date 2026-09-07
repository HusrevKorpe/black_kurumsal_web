import 'server-only'
import { logAudit } from '@/features/audit/log'
import { removeObjects } from '@/features/media/storage'
import { fail, ok, type ActionResult } from '@/lib/actions/result'
import { assertOwner, type StaffContext } from '@/lib/auth/authorize'
import { db } from '@/lib/db'
import { tr } from '@/lib/i18n/tr'

/**
 * Çöp kutusundan geri alır. Slug korunduğu için dükkan eski adresine döner; `isActive` de
 * korunur, yani silinmeden önce pasifse pasif döner (silme yayına almak değildir).
 */
export async function restoreShop(
  staff: StaffContext,
  shopId: string,
): Promise<ActionResult<null>> {
  assertOwner(staff)
  await db.$transaction(async (tx) => {
    const shop = await tx.shop.update({
      where: { id: shopId, deletedAt: { not: null } },
      data: { deletedAt: null },
      select: { name: true },
    })
    await logAudit(tx, {
      staffId: staff.id,
      action: 'shop.restore',
      entityType: 'Shop',
      entityId: shopId,
      summary: `${shop.name} dükkanı geri alındı`,
    })
  })
  return ok(null)
}

/**
 * Dükkanı ve ona bağlı her şeyi kalıcı siler; dosyalar DB işlemi bittikten sonra Storage'dan
 * kaldırılır. Yalnızca çöp kutusundaki kayıt silinebilir: kalıcı silme bilinçli iki adımdır.
 */
export async function purgeShop(staff: StaffContext, shopId: string): Promise<ActionResult<null>> {
  assertOwner(staff)
  const paths = await db.$transaction(async (tx) => {
    const shop = await tx.shop.findFirst({
      where: { id: shopId, deletedAt: { not: null } },
      select: {
        name: true,
        gallery: { select: { media: { select: { id: true, path: true } } } },
        campaigns: { select: { image: { select: { id: true, path: true } } } },
        priceCategories: {
          select: { items: { select: { image: { select: { id: true, path: true } } } } },
        },
      },
    })
    if (!shop) return null
    const media = [
      ...shop.gallery.map((g) => g.media),
      ...shop.campaigns.map((c) => c.image),
      ...shop.priceCategories.flatMap((c) => c.items.flatMap((i) => (i.image ? [i.image] : []))),
    ]
    await tx.shop.delete({ where: { id: shopId } })
    if (media.length > 0) {
      await tx.media.deleteMany({ where: { id: { in: media.map((m) => m.id) } } })
    }
    await logAudit(tx, {
      staffId: staff.id,
      action: 'shop.purge',
      entityType: 'Shop',
      entityId: shopId,
      summary: `${shop.name} dükkanı kalıcı olarak silindi`,
    })
    return media.map((m) => m.path)
  })
  if (paths === null) return fail(tr.errors.notFound)
  await removeObjects(paths)
  return ok(null)
}

export async function restoreLocation(
  staff: StaffContext,
  locationId: string,
): Promise<ActionResult<null>> {
  assertOwner(staff)
  await db.$transaction(async (tx) => {
    const location = await tx.location.update({
      where: { id: locationId, deletedAt: { not: null } },
      data: { deletedAt: null },
      select: { name: true },
    })
    await logAudit(tx, {
      staffId: staff.id,
      action: 'location.restore',
      entityType: 'Location',
      entityId: locationId,
      summary: `${location.name} mekanı geri alındı`,
    })
  })
  return ok(null)
}

/**
 * Mekanı kalıcı siler. İçinde hâlâ dükkan varsa (çöp kutusundakiler dahil) silinmez:
 * mekan gidince dükkanların bağı sessizce kopardı.
 */
export async function purgeLocation(
  staff: StaffContext,
  locationId: string,
): Promise<ActionResult<null>> {
  assertOwner(staff)
  const shopCount = await db.shop.count({ where: { locationId } })
  if (shopCount > 0) return fail(tr.admin.trash.locationHasShops)

  const paths = await db.$transaction(async (tx) => {
    const location = await tx.location.findFirst({
      where: { id: locationId, deletedAt: { not: null } },
      select: {
        name: true,
        gallery: { select: { media: { select: { id: true, path: true } } } },
        campaigns: { select: { image: { select: { id: true, path: true } } } },
      },
    })
    if (!location) return null
    const media = [
      ...location.gallery.map((g) => g.media),
      ...location.campaigns.map((c) => c.image),
    ]
    await tx.location.delete({ where: { id: locationId } })
    if (media.length > 0) {
      await tx.media.deleteMany({ where: { id: { in: media.map((m) => m.id) } } })
    }
    await logAudit(tx, {
      staffId: staff.id,
      action: 'location.purge',
      entityType: 'Location',
      entityId: locationId,
      summary: `${location.name} mekanı kalıcı olarak silindi`,
    })
    return media.map((m) => m.path)
  })
  if (paths === null) return fail(tr.errors.notFound)
  await removeObjects(paths)
  return ok(null)
}
