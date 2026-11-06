import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { EventDangerZone } from '@/components/admin/events/event-danger-zone'
import { EventForm } from '@/components/admin/events/event-form'
import { PageHeader } from '@/components/admin/page-header'
import { getEventForAdmin, listEventShops } from '@/features/events/admin-queries'
import { requireStaff } from '@/lib/auth/session'
import { ROUTES } from '@/lib/constants/routes'
import { tr } from '@/lib/i18n/tr'

export const metadata: Metadata = { title: tr.admin.events.editTitle, robots: { index: false } }

export default async function EditEventPage({ params }: PageProps<'/admin/etkinlikler/[id]'>) {
  const { id } = await params
  const staff = await requireStaff()
  const [event, shops] = await Promise.all([getEventForAdmin(staff, id), listEventShops(staff)])
  if (!event) notFound()

  return (
    <div className="mx-auto w-full max-w-3xl space-y-10">
      <PageHeader
        title={event.title}
        breadcrumb={
          <Link href={ROUTES.admin.events} className="hover:text-foreground">
            ← {tr.admin.events.title}
          </Link>
        }
      />
      <EventForm mode="edit" event={event} shops={shops} isOwner={staff.role === 'OWNER'} />
      <EventDangerZone eventId={event.id} title={event.title} />
    </div>
  )
}
