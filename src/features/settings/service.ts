import 'server-only'
import { logAudit } from '@/features/audit/log'
import type { SiteSettings } from '@/generated/prisma/client'
import { fail, fromZodError, ok, type ActionResult } from '@/lib/actions/result'
import { assertOwner, type StaffContext } from '@/lib/auth/authorize'
import { db } from '@/lib/db'
import { siteSettingsSchema } from './schema'

export async function updateSiteSettings(
  staff: StaffContext,
  input: unknown,
): Promise<ActionResult<SiteSettings>> {
  assertOwner(staff)
  const parsed = siteSettingsSchema.safeParse(input)
  if (!parsed.success) return fromZodError(parsed.error)
  if (parsed.data.logoImageId) {
    const media = await db.media.findUnique({
      where: { id: parsed.data.logoImageId },
      select: { path: true },
    })
    if (!media || !media.path.startsWith('settings/')) return fail('Logo görseli bulunamadı.')
  }

  const settings = await db.$transaction(async (tx) => {
    const saved = await tx.siteSettings.upsert({
      where: { id: 1 },
      create: { id: 1, ...parsed.data },
      update: parsed.data,
    })
    await logAudit(tx, {
      staffId: staff.id,
      action: 'settings.update',
      entityType: 'SiteSettings',
      entityId: '1',
      summary: 'Site ayarları güncellendi',
    })
    return saved
  })
  return ok(settings)
}
