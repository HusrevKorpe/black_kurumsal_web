import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LocationDangerZone } from '@/components/admin/locations/location-danger-zone'
import { LocationForm } from '@/components/admin/locations/location-form'
import { getLocationForAdmin } from '@/features/locations/admin-queries'
import { requireOwner } from '@/lib/auth/session'
import { tr } from '@/lib/i18n/tr'

export const metadata: Metadata = { title: tr.admin.locations.tabs.info, robots: { index: false } }

export default async function LocationInfoPage({ params }: PageProps<'/admin/mekanlar/[id]'>) {
  const { id } = await params
  await requireOwner()
  const location = await getLocationForAdmin(id)
  if (!location) notFound()

  return (
    <div className="space-y-10">
      <LocationForm mode="edit" location={location} />
      <LocationDangerZone
        locationId={location.id}
        locationName={location.name}
        shopCount={location._count.shops}
      />
    </div>
  )
}
