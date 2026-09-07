'use server'

import type { ActionResult } from '@/lib/actions/result'
import { runAction } from '@/lib/actions/run'
import { requireStaff } from '@/lib/auth/session'
import { revalidatePublicSite } from '@/lib/revalidate'
import { saveLocationHours, saveShopHours } from './service'
import { deleteHoursException, saveHoursException } from './service-exceptions'

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

export async function saveShopHoursExceptionAction(
  shopId: string,
  input: unknown,
): Promise<ActionResult<null>> {
  return runAction(async () => {
    const staff = await requireStaff()
    const result = await saveHoursException(staff, { kind: 'shop', id: shopId }, input)
    if (result.ok) revalidatePublicSite()
    return result
  })
}

export async function deleteShopHoursExceptionAction(
  shopId: string,
  exceptionId: string,
): Promise<ActionResult<null>> {
  return runAction(async () => {
    const staff = await requireStaff()
    const result = await deleteHoursException(staff, { kind: 'shop', id: shopId }, exceptionId)
    if (result.ok) revalidatePublicSite()
    return result
  })
}

export async function saveLocationHoursExceptionAction(
  locationId: string,
  input: unknown,
): Promise<ActionResult<null>> {
  return runAction(async () => {
    const staff = await requireStaff()
    const result = await saveHoursException(staff, { kind: 'location', id: locationId }, input)
    if (result.ok) revalidatePublicSite()
    return result
  })
}

export async function deleteLocationHoursExceptionAction(
  locationId: string,
  exceptionId: string,
): Promise<ActionResult<null>> {
  return runAction(async () => {
    const staff = await requireStaff()
    const result = await deleteHoursException(
      staff,
      { kind: 'location', id: locationId },
      exceptionId,
    )
    if (result.ok) revalidatePublicSite()
    return result
  })
}
