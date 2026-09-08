import 'server-only'
import { logAudit } from '@/features/audit/log'
import type { Shop } from '@/generated/prisma/client'
import { fail, fromZodError, ok, type ActionResult } from '@/lib/actions/result'
import { assertOwner, assertShopAccess, isOwner, type StaffContext } from '@/lib/auth/authorize'
import { db } from '@/lib/db'
import { tr } from '@/lib/i18n/tr'
import {
  managerShopFormSchema,
  shopFormSchema,
  type ManagerShopFormInput,
  type ShopFormInput,
} from './schema'

/**
 * Silinen dükkan kaydı veritabanında kaldığı için slug'ı da tutulu kalır. Çakışma P2002'nin
 * genel "zaten kullanılıyor" mesajı yerine nedenini söyleyen mesajla döner.
 */
async function slugHeldByDeleted(slug: string): Promise<boolean> {
  const held = await db.shop.count({ where: { slug, deletedAt: { not: null } } })
  return held > 0
}

export async function createShop(staff: StaffContext, input: unknown): Promise<ActionResult<Shop>> {
  assertOwner(staff)
  const parsed = shopFormSchema.safeParse(input)
  if (!parsed.success) return fromZodError(parsed.error)
  if (await slugHeldByDeleted(parsed.data.slug)) return fail(tr.admin.shops.slugHeld)

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
  // Sorumlunun formunda slug yok; adres yalnızca patron tarafından değiştirilir, kontrolü de orada.
  if (!isOwner(staff)) {
    const parsed = managerShopFormSchema.safeParse(input)
    if (!parsed.success) return fromZodError(parsed.error)
    return persistShopUpdate(staff, shopId, parsed.data)
  }
  const parsed = shopFormSchema.safeParse(input)
  if (!parsed.success) return fromZodError(parsed.error)
  if (await slugHeldByDeleted(parsed.data.slug)) return fail(tr.admin.shops.slugHeld)
  return persistShopUpdate(staff, shopId, parsed.data)
}

async function persistShopUpdate(
  staff: StaffContext,
  shopId: string,
  data: ShopFormInput | ManagerShopFormInput,
): Promise<ActionResult<Shop>> {
  const shop = await db.$transaction(async (tx) => {
    const updated = await tx.shop.update({ where: { id: shopId }, data })
    await logAudit(tx, {
      staffId: staff.id,
      action: 'shop.update',
      entityType: 'Shop',
      entityId: shopId,
      summary: `${updated.name} bilgileri güncellendi`,
      data: { fields: Object.keys(data) },
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
 * Dükkanı siler: siteden ve panelden düşer. Kayıt ve dosyaları veritabanında `deletedAt`
 * işaretiyle durur, ama panelde geri getirecek bir ekran yoktur. Yalnızca patron.
 */
export async function deleteShop(staff: StaffContext, shopId: string): Promise<ActionResult<null>> {
  assertOwner(staff)
  await db.$transaction(async (tx) => {
    const shop = await tx.shop.update({
      where: { id: shopId, deletedAt: null },
      data: { deletedAt: new Date() },
      select: { name: true },
    })
    await logAudit(tx, {
      staffId: staff.id,
      action: 'shop.delete',
      entityType: 'Shop',
      entityId: shopId,
      summary: `${shop.name} dükkanı silindi`,
    })
  })
  return ok(null)
}
