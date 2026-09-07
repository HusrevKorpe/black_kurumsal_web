import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { HoursEditor } from '@/components/admin/hours-editor'
import { HoursExceptionsEditor } from '@/components/admin/hours-exceptions-editor'
import {
  deleteShopHoursExceptionAction,
  saveShopHoursAction,
  saveShopHoursExceptionAction,
} from '@/features/hours/actions'
import { toAdminExceptionEntries } from '@/features/hours'
import { getShopForAdmin } from '@/features/shops/admin-queries'
import { requireStaff } from '@/lib/auth/session'
import { tr } from '@/lib/i18n/tr'

export const metadata: Metadata = { title: tr.admin.hours.title, robots: { index: false } }

export default async function ShopHoursPage({
  params,
}: PageProps<'/admin/dukkanlar/[id]/saatler'>) {
  const { id } = await params
  const staff = await requireStaff()
  const shop = await getShopForAdmin(staff, id)
  if (!shop) notFound()

  const boundSave = saveShopHoursAction.bind(null, shop.id)
  const venue = shop.location?.kind === 'VENUE' ? shop.location : null
  const usesOwnHours = shop.hours.length > 0

  // Özel günler haftalık saatlerle aynı kaynaktan gelir: saatler devralınıyorsa mekanınkiler
  // geçerlidir ve burada yalnızca gösterilir.
  const inheritsHours = !usesOwnHours && venue !== null
  const exceptions = toAdminExceptionEntries(
    inheritsHours ? (venue?.hoursExceptions ?? []) : shop.hoursExceptions,
  )

  return (
    <div className="space-y-8">
      <HoursEditor
        key={shop.updatedAt.toISOString()}
        initialHours={shop.hours}
        inherited={venue ? { name: venue.name, hours: venue.hours } : null}
        useOwnLabel={tr.admin.hours.useOwn}
        hint={venue ? tr.admin.hours.inheritHint(venue.name) : tr.admin.hours.noVenueHint}
        saveAction={boundSave}
      />
      <HoursExceptionsEditor
        exceptions={exceptions}
        readOnlyNote={
          inheritsHours && venue ? tr.admin.hours.exceptions.inheritedNote(venue.name) : null
        }
        saveAction={saveShopHoursExceptionAction.bind(null, shop.id)}
        deleteAction={deleteShopHoursExceptionAction.bind(null, shop.id)}
      />
    </div>
  )
}
