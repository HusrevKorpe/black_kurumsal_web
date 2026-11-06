import type { Metadata } from 'next'
import { EventForm } from '@/components/admin/events/event-form'
import { PageHeader } from '@/components/admin/page-header'
import { listEventShops } from '@/features/events/admin-queries'
import { requireStaff } from '@/lib/auth/session'
import { tr } from '@/lib/i18n/tr'

export const metadata: Metadata = { title: tr.admin.events.createTitle, robots: { index: false } }

export default async function NewEventPage() {
  const staff = await requireStaff()
  const shops = await listEventShops(staff)
  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader title={tr.admin.events.createTitle} />
      <EventForm mode="create" shops={shops} isOwner={staff.role === 'OWNER'} />
    </div>
  )
}
