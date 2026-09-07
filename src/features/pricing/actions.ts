'use server'

import type { PriceCategory } from '@/generated/prisma/client'
import type { ActionResult } from '@/lib/actions/result'
import { runAction } from '@/lib/actions/run'
import { requireStaff } from '@/lib/auth/session'
import { revalidatePublicSite } from '@/lib/revalidate'
import * as categories from './service-categories'
import * as items from './service-items'
import type { PriceItemView } from './view'

async function withRevalidate<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  return runAction(async () => {
    const result = await fn()
    if (result.ok) revalidatePublicSite()
    return result
  })
}

export async function createCategoryAction(input: unknown): Promise<ActionResult<PriceCategory>> {
  return withRevalidate(async () => categories.createCategory(await requireStaff(), input))
}
export async function updateCategoryAction(
  categoryId: string,
  input: unknown,
): Promise<ActionResult<PriceCategory>> {
  return withRevalidate(async () =>
    categories.updateCategory(await requireStaff(), categoryId, input),
  )
}
export async function deleteCategoryAction(categoryId: string): Promise<ActionResult<null>> {
  return withRevalidate(async () => categories.deleteCategory(await requireStaff(), categoryId))
}
export async function reorderCategoriesAction(
  shopId: string,
  input: unknown,
): Promise<ActionResult<null>> {
  return withRevalidate(async () =>
    categories.reorderCategories(await requireStaff(), shopId, input),
  )
}

export async function createItemAction(input: unknown): Promise<ActionResult<PriceItemView>> {
  return withRevalidate(async () => items.createItem(await requireStaff(), input))
}
export async function updateItemAction(
  itemId: string,
  input: unknown,
): Promise<ActionResult<PriceItemView>> {
  return withRevalidate(async () => items.updateItem(await requireStaff(), itemId, input))
}
export async function deleteItemAction(itemId: string): Promise<ActionResult<null>> {
  return withRevalidate(async () => items.deleteItem(await requireStaff(), itemId))
}
export async function reorderItemsAction(
  categoryId: string,
  input: unknown,
): Promise<ActionResult<null>> {
  return withRevalidate(async () => items.reorderItems(await requireStaff(), categoryId, input))
}
