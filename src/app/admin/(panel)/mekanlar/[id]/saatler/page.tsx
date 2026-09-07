import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { HoursEditor } from '@/components/admin/hours-editor'
import { HoursExceptionsEditor } from '@/components/admin/hours-exceptions-editor'
import { toAdminExceptionEntries } from '@/features/hours'
import {
  deleteLocationHoursExceptionAction,
  saveLocationHoursAction,
  saveLocationHoursExceptionAction,
} from '@/features/hours/actions'
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
    <div className="space-y-8">
      <HoursEditor
        key={location.updatedAt.toISOString()}
        initialHours={location.hours}
        inherited={null}
        useOwnLabel={tr.admin.hours.locationUseOwn}
        hint={tr.admin.hours.overnightHint}
        saveAction={saveLocationHoursAction.bind(null, location.id)}
      />
      <HoursExceptionsEditor
        exceptions={toAdminExceptionEntries(location.hoursExceptions)}
        readOnlyNote={null}
        saveAction={saveLocationHoursExceptionAction.bind(null, location.id)}
        deleteAction={deleteLocationHoursExceptionAction.bind(null, location.id)}
      />
    </div>
  )
}
