import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { HoursEditor } from '@/components/admin/hours-editor'
import { saveShopHoursAction } from '@/features/hours/actions'
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

  return (
    <HoursEditor
      key={shop.updatedAt.toISOString()}
      initialHours={shop.hours}
      inherited={venue ? { name: venue.name, hours: venue.hours } : null}
      useOwnLabel={tr.admin.hours.useOwn}
      hint={venue ? tr.admin.hours.inheritHint(venue.name) : tr.admin.hours.noVenueHint}
      saveAction={boundSave}
    />
  )
}
