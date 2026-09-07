import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { HoursEditor } from '@/components/admin/hours-editor'
import { saveLocationHoursAction } from '@/features/hours/actions'
import { getLocationForAdmin } from '@/features/locations/admin-queries'
import { requireOwner } from '@/lib/auth/session'
import { tr } from '@/lib/i18n/tr'

export const metadata: Metadata = { title: tr.admin.hours.title, robots: { index: false } }

export default async function LocationHoursPage({
  params,
}: PageProps<'/admin/mekanlar/[id]/saatler'>) {
  const { id } = await params
  await requireOwner()
  const location = await getLocationForAdmin(id)
  if (!location) notFound()

  return (
    <HoursEditor
      key={location.updatedAt.toISOString()}
      initialHours={location.hours}
      inherited={null}
      useOwnLabel={tr.admin.hours.locationUseOwn}
      hint={tr.admin.hours.overnightHint}
      saveAction={saveLocationHoursAction.bind(null, location.id)}
    />
  )
}
