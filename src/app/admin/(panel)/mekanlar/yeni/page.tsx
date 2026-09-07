import type { Metadata } from 'next'
import { LocationForm } from '@/components/admin/locations/location-form'
import { PageHeader } from '@/components/admin/page-header'
import { requireOwner } from '@/lib/auth/session'
import { tr } from '@/lib/i18n/tr'

export const metadata: Metadata = {
  title: tr.admin.locations.createTitle,
  robots: { index: false },
}

export default async function NewLocationPage() {
  await requireOwner()
  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader title={tr.admin.locations.createTitle} />
      <LocationForm mode="create" />
    </div>
  )
}
