'use server'

import type { ActionResult } from '@/lib/actions/result'
import { runAction } from '@/lib/actions/run'
import { requireStaff } from '@/lib/auth/session'
import { revalidatePublicSite } from '@/lib/revalidate'
import { saveLocationHours, saveShopHours } from './service'

export async function saveShopHoursAction(
  shopId: string,
  input: unknown,
): Promise<ActionResult<null>> {
  return runAction(async () => {
    const staff = await requireStaff()
    const result = await saveShopHours(staff, shopId, input)
    if (result.ok) revalidatePublicSite()
    return result
  })
}

export async function saveLocationHoursAction(
  locationId: string,
  input: unknown,
): Promise<ActionResult<null>> {
  return runAction(async () => {
    const staff = await requireStaff()
    const result = await saveLocationHours(staff, locationId, input)
    if (result.ok) revalidatePublicSite()
    return result
  })
}
