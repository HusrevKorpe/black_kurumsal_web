'use server'

import type { StaffUser } from '@/generated/prisma/client'
import type { ActionResult } from '@/lib/actions/result'
import { runAction } from '@/lib/actions/run'
import { requireStaff } from '@/lib/auth/session'
import * as service from './service'

export async function createStaffAction(input: unknown): Promise<ActionResult<StaffUser>> {
  return runAction(async () => service.createStaff(await requireStaff(), input))
}
export async function updateStaffAction(input: unknown): Promise<ActionResult<StaffUser>> {
  return runAction(async () => service.updateStaff(await requireStaff(), input))
}
export async function resetStaffPasswordAction(input: unknown): Promise<ActionResult<null>> {
  return runAction(async () => service.resetStaffPassword(await requireStaff(), input))
}
