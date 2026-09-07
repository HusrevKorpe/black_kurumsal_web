'use server'

import type { Location } from '@/generated/prisma/client'
import type { ActionResult } from '@/lib/actions/result'
import { runAction } from '@/lib/actions/run'
import { requireStaff } from '@/lib/auth/session'
import { revalidatePublicSite } from '@/lib/revalidate'
import * as service from './service'

async function withRevalidate<T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  return runAction(async () => {
    const result = await fn()
    if (result.ok) revalidatePublicSite()
    return result
  })
}

export async function createLocationAction(input: unknown): Promise<ActionResult<Location>> {
  return withRevalidate(async () => service.createLocation(await requireStaff(), input))
}
export async function updateLocationAction(
  locationId: string,
  input: unknown,
): Promise<ActionResult<Location>> {
  return withRevalidate(async () => service.updateLocation(await requireStaff(), locationId, input))
}
export async function setLocationCoverAction(
  locationId: string,
  mediaId: string | null,
): Promise<ActionResult<null>> {
  return withRevalidate(async () =>
    service.setLocationCover(await requireStaff(), locationId, mediaId),
  )
}
export async function deleteLocationAction(locationId: string): Promise<ActionResult<null>> {
  return withRevalidate(async () => service.deleteLocation(await requireStaff(), locationId))
}
