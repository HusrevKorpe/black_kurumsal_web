import 'server-only'
import { logAudit } from '@/features/audit/log'
import { removeObjects } from '@/features/media/storage'
import type { PriceCategory } from '@/generated/prisma/client'
import { fail, fromZodError, ok, type ActionResult } from '@/lib/actions/result'
import { assertShopAccess, type StaffContext } from '@/lib/auth/authorize'
import { db } from '@/lib/db'
import { priceCategorySchema, reorderSchema } from './schema'

const updateSchema = priceCategorySchema.omit({ shopId: true })

async function shopOfCategory(staff: StaffContext, categoryId: string) {
  const category = await db.priceCategory.findUnique({
    where: { id: categoryId },
    select: { shopId: true, name: true, shop: { select: { name: true } } },
  })
  if (!category) return null
  assertShopAccess(staff, category.shopId)
  return category
}

export async function createCategory(
  staff: StaffContext,
  input: unknown,
): Promise<ActionResult<PriceCategory>> {
  const parsed = priceCategorySchema.safeParse(input)
  if (!parsed.success) return fromZodError(parsed.error)
  assertShopAccess(staff, parsed.data.shopId)

  const category = await db.$transaction(async (tx) => {
    const count = await tx.priceCategory.count({ where: { shopId: parsed.data.shopId } })
    const created = await tx.priceCategory.create({ data: { ...parsed.data, sortOrder: count } })
    const shop = await tx.shop.findUniqueOrThrow({
      where: { id: parsed.data.shopId },
      select: { name: true },
    })
    await logAudit(tx, {
      staffId: staff.id,
      action: 'pricing.category.create',
      entityType: 'Shop',
      entityId: parsed.data.shopId,
      summary: `${shop.name}: "${created.name}" kategorisi eklendi`,
    })
    return created
  })
  return ok(category)
}

export async function updateCategory(
  staff: StaffContext,
  categoryId: string,
  input: unknown,
): Promise<ActionResult<PriceCategory>> {
  const parsed = updateSchema.safeParse(input)
  if (!parsed.success) return fromZodError(parsed.error)
  const category = await shopOfCategory(staff, categoryId)
  if (!category) return fail('Kategori bulunamadı.')

  const updated = await db.$transaction(async (tx) => {
    const result = await tx.priceCategory.update({ where: { id: categoryId }, data: parsed.data })
    await logAudit(tx, {
      staffId: staff.id,
      action: 'pricing.category.update',
      entityType: 'Shop',
      entityId: category.shopId,
      summary: `${category.shop.name}: "${result.name}" kategorisi güncellendi`,
    })
    return result
  })
  return ok(updated)
}

/** Kategoriyi ve kalemlerini siler; kalem görselleri Storage'dan kaldırılır. */
export async function deleteCategory(
  staff: StaffContext,
  categoryId: string,
): Promise<ActionResult<null>> {
  const category = await shopOfCategory(staff, categoryId)
  if (!category) return fail('Kategori bulunamadı.')

  const paths = await db.$transaction(async (tx) => {
    const images = await tx.media.findMany({
      where: { priceItems: { some: { categoryId } } },
      select: { id: true, path: true },
    })
    await tx.priceCategory.delete({ where: { id: categoryId } })
    if (images.length > 0)
      await tx.media.deleteMany({ where: { id: { in: images.map((i) => i.id) } } })
    await logAudit(tx, {
      staffId: staff.id,
      action: 'pricing.category.delete',
      entityType: 'Shop',
      entityId: category.shopId,
      summary: `${category.shop.name}: "${category.name}" kategorisi silindi`,
    })
    return images.map((i) => i.path)
  })
  await removeObjects(paths)
  return ok(null)
}

export async function reorderCategories(
  staff: StaffContext,
  shopId: string,
  input: unknown,
): Promise<ActionResult<null>> {
  assertShopAccess(staff, shopId)
  const parsed = reorderSchema.safeParse(input)
  if (!parsed.success) return fromZodError(parsed.error)

  const existing = await db.priceCategory.findMany({ where: { shopId }, select: { id: true } })
  const ids = new Set(existing.map((e) => e.id))
  if (parsed.data.ids.length !== ids.size || parsed.data.ids.some((id) => !ids.has(id))) {
    return fail('Sıralama listesi güncel değil. Sayfayı yenileyin.')
  }
  await db.$transaction(
    parsed.data.ids.map((id, index) =>
      db.priceCategory.update({ where: { id }, data: { sortOrder: index } }),
    ),
  )
  return ok(null)
}
