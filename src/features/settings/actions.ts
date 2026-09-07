'use server'

import type { SiteSettings } from '@/generated/prisma/client'
import type { ActionResult } from '@/lib/actions/result'
import { runAction } from '@/lib/actions/run'
import { requireStaff } from '@/lib/auth/session'
import { revalidatePublicSite } from '@/lib/revalidate'
import { updateSiteSettings } from './service'

export async function updateSiteSettingsAction(
  input: unknown,
): Promise<ActionResult<SiteSettings>> {
  return runAction(async () => {
    const result = await updateSiteSettings(await requireStaff(), input)
    if (result.ok) revalidatePublicSite()
    return result
  })
}
