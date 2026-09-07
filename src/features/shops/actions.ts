'use server'

import type { Shop } from '@/generated/prisma/client'
import type { ActionResult } from '@/lib/actions/result'
import { runAction } from '@/lib/actions/run'
import { requireStaff } from '@/lib/auth/session'
import { revalidatePublicSite } from '@/lib/revalidate'
import * as service from './service'

export async function createShopAction(input: unknown): Promise<ActionResult<Shop>> {
  return runAction(async () => {
    const staff = await requireStaff()
    const result = await service.createShop(staff, input)
    if (result.ok) revalidatePublicSite()
    return result
  })
}

export async function updateShopAction(
  shopId: string,
  input: unknown,
): Promise<ActionResult<Shop>> {
  return runAction(async () => {
    const staff = await requireStaff()
    const result = await service.updateShop(staff, shopId, input)
    if (result.ok) revalidatePublicSite()
    return result
  })
}

export async function setShopCoverAction(
  shopId: string,
  mediaId: string | null,
): Promise<ActionResult<null>> {
  return runAction(async () => {
    const staff = await requireStaff()
    const result = await service.setShopCover(staff, shopId, mediaId)
    if (result.ok) revalidatePublicSite()
    return result
  })
}

export async function deleteShopAction(shopId: string): Promise<ActionResult<null>> {
  return runAction(async () => {
    const staff = await requireStaff()
    const result = await service.deleteShop(staff, shopId)
    if (result.ok) revalidatePublicSite()
    return result
  })
}
