'use server'

import type { ActionResult } from '@/lib/actions/result'
import { runAction } from '@/lib/actions/run'
import { requireStaff } from '@/lib/auth/session'
import { revalidatePublicSite } from '@/lib/revalidate'
import * as service from './service'

async function withRevalidate(fn: () => Promise<ActionResult<null>>): Promise<ActionResult<null>> {
  return runAction(async () => {
    const result = await fn()
    if (result.ok) revalidatePublicSite()
    return result
  })
}

export async function restoreShopAction(shopId: string): Promise<ActionResult<null>> {
  return withRevalidate(async () => service.restoreShop(await requireStaff(), shopId))
}

export async function purgeShopAction(shopId: string): Promise<ActionResult<null>> {
  return withRevalidate(async () => service.purgeShop(await requireStaff(), shopId))
}

export async function restoreLocationAction(locationId: string): Promise<ActionResult<null>> {
  return withRevalidate(async () => service.restoreLocation(await requireStaff(), locationId))
}

export async function purgeLocationAction(locationId: string): Promise<ActionResult<null>> {
  return withRevalidate(async () => service.purgeLocation(await requireStaff(), locationId))
}
