import 'server-only'
import { logAudit } from '@/features/audit/log'
import { deleteMediaRow, removeObjects } from '@/features/media/service'
import { fail, fromZodError, ok, type ActionResult } from '@/lib/actions/result'
import { assertShopAccess, type StaffContext } from '@/lib/auth/authorize'
import { db } from '@/lib/db'
import { priceItemSchema, reorderSchema } from './schema'
import { toPriceItemView, type PriceItemView } from './view'

const updateSchema = priceItemSchema.omit({ categoryId: true })

interface CategoryContext {
  id: string
  shopId: string
  shopName: string
}

async function categoryContext(
  staff: StaffContext,
  categoryId: string,
): Promise<CategoryContext | null> {
  const category = await db.priceCategory.findUnique({
    where: { id: categoryId },
    select: { id: true, shopId: true, shop: { select: { name: true } } },
  })
  if (!category) return null
  assertShopAccess(staff, category.shopId)
  return { id: category.id, shopId: category.shopId, shopName: category.shop.name }
}

/** Kalem görseli dükkanın "price-item" medyası olmalı. */
async function assertItemImage(
  shopId: string,
  imageId: string | null | undefined,
): Promise<string | null> {
  if (!imageId) return null
  const media = await db.media.findUnique({ where: { id: imageId }, select: { path: true } })
  if (!media || !media.path.startsWith(`price-item/${shopId}/`))
    throw new Error('Görsel bu dükkana ait değil')
  return null
}

export async function createItem(
  staff: StaffContext,
  input: unknown,
): Promise<ActionResult<PriceItemView>> {
  const parsed = priceItemSchema.safeParse(input)
  if (!parsed.success) return fromZodError(parsed.error)
  const ctx = await categoryContext(staff, parsed.data.categoryId)
  if (!ctx) return fail('Kategori bulunamadı.')
  const imageError = await assertItemImage(ctx.shopId, parsed.data.imageId)
  if (imageError) return fail(imageError)

  const item = await db.$transaction(async (tx) => {
    const count = await tx.priceItem.count({ where: { categoryId: ctx.id } })
    const created = await tx.priceItem.create({
      data: { ...parsed.data, imageId: parsed.data.imageId ?? null, sortOrder: count },
      include: { image: true },
    })
    await logAudit(tx, {
      staffId: staff.id,
      action: 'pricing.item.create',
      entityType: 'Shop',
      entityId: ctx.shopId,
      summary: `${ctx.shopName}: "${created.name}" kalemi eklendi`,
    })
    return created
  })
  // Prisma Decimal istemciye taşınamaz; sınırda görünüm nesnesine çevrilir.
  return ok(toPriceItemView(item))
}

export async function updateItem(
  staff: StaffContext,
  itemId: string,
  input: unknown,
): Promise<ActionResult<PriceItemView>> {
  const parsed = updateSchema.safeParse(input)
  if (!parsed.success) return fromZodError(parsed.error)
  const item = await db.priceItem.findUnique({
    where: { id: itemId },
    select: { categoryId: true, imageId: true },
  })
  if (!item) return fail('Kalem bulunamadı.')
  const ctx = await categoryContext(staff, item.categoryId)
  if (!ctx) return fail('Kategori bulunamadı.')
  const imageError = await assertItemImage(ctx.shopId, parsed.data.imageId)
  if (imageError) return fail(imageError)

  const replacedImage =
    item.imageId && parsed.data.imageId !== undefined && parsed.data.imageId !== item.imageId
      ? item.imageId
      : null

  const { updated, path } = await db.$transaction(async (tx) => {
    const result = await tx.priceItem.update({
      where: { id: itemId },
      data: {
        ...parsed.data,
        imageId: parsed.data.imageId === undefined ? undefined : parsed.data.imageId,
      },
      include: { image: true },
    })
    const removedPath = replacedImage ? await deleteMediaRow(tx, replacedImage) : null
    await logAudit(tx, {
      staffId: staff.id,
      action: 'pricing.item.update',
      entityType: 'Shop',
      entityId: ctx.shopId,
      summary: `${ctx.shopName}: "${result.name}" kalemi güncellendi`,
    })
    return { updated: result, path: removedPath }
  })
  if (path) await removeObjects([path])
  return ok(toPriceItemView(updated))
}

export async function deleteItem(staff: StaffContext, itemId: string): Promise<ActionResult<null>> {
  const item = await db.priceItem.findUnique({
    where: { id: itemId },
    select: { name: true, categoryId: true, imageId: true },
  })
  if (!item) return fail('Kalem bulunamadı.')
  const ctx = await categoryContext(staff, item.categoryId)
  if (!ctx) return fail('Kategori bulunamadı.')

  const path = await db.$transaction(async (tx) => {
    await tx.priceItem.delete({ where: { id: itemId } })
    const removed = item.imageId ? await deleteMediaRow(tx, item.imageId) : null
    await logAudit(tx, {
      staffId: staff.id,
      action: 'pricing.item.delete',
      entityType: 'Shop',
      entityId: ctx.shopId,
      summary: `${ctx.shopName}: "${item.name}" kalemi silindi`,
    })
    return removed
  })
  if (path) await removeObjects([path])
  return ok(null)
}

export async function reorderItems(
  staff: StaffContext,
  categoryId: string,
  input: unknown,
): Promise<ActionResult<null>> {
  const parsed = reorderSchema.safeParse(input)
  if (!parsed.success) return fromZodError(parsed.error)
  const ctx = await categoryContext(staff, categoryId)
  if (!ctx) return fail('Kategori bulunamadı.')

  const existing = await db.priceItem.findMany({ where: { categoryId }, select: { id: true } })
  const ids = new Set(existing.map((e) => e.id))
  if (parsed.data.ids.length !== ids.size || parsed.data.ids.some((id) => !ids.has(id))) {
    return fail('Sıralama listesi güncel değil. Sayfayı yenileyin.')
  }
  await db.$transaction(
    parsed.data.ids.map((id, index) =>
      db.priceItem.update({ where: { id }, data: { sortOrder: index } }),
    ),
  )
  return ok(null)
}
