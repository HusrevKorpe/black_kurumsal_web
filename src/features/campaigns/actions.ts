'use server'

import type { Campaign } from '@/generated/prisma/client'
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

export async function createCampaignAction(input: unknown): Promise<ActionResult<Campaign>> {
  return withRevalidate(async () => service.createCampaign(await requireStaff(), input))
}
export async function updateCampaignAction(
  campaignId: string,
  input: unknown,
): Promise<ActionResult<Campaign>> {
  return withRevalidate(async () => service.updateCampaign(await requireStaff(), campaignId, input))
}
export async function deleteCampaignAction(campaignId: string): Promise<ActionResult<null>> {
  return withRevalidate(async () => service.deleteCampaign(await requireStaff(), campaignId))
}
