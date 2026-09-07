import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/page-header'
import { SettingsForm } from '@/components/admin/settings/settings-form'
import { db } from '@/lib/db'
import { getSiteSettings } from '@/features/settings/queries'
import { requireOwner } from '@/lib/auth/session'
import { tr } from '@/lib/i18n/tr'
import { mediaPublicUrl } from '@/lib/media/url'

export const metadata: Metadata = { title: tr.admin.settings.title, robots: { index: false } }

export default async function SettingsPage() {
  await requireOwner()
  const settings = await getSiteSettings()
  const logo = settings.logoImageId
    ? await db.media.findUnique({
        where: { id: settings.logoImageId },
        select: { bucket: true, path: true },
      })
    : null

  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader title={tr.admin.settings.title} />
      <SettingsForm
        key={settings.updatedAt.toISOString()}
        settings={settings}
        logo={logo ? { id: settings.logoImageId as string, url: mediaPublicUrl(logo) } : null}
      />
    </div>
  )
}
