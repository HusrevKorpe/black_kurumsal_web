import { ChevronRightIcon, PlusIcon } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/admin/page-header'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { listEventsForStaff, type AdminEventData } from '@/features/events/admin-queries'
import { requireStaff } from '@/lib/auth/session'
import { ROUTES } from '@/lib/constants/routes'
import { tr } from '@/lib/i18n/tr'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: tr.admin.events.title, robots: { index: false } }

const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'short',
  weekday: 'short',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Istanbul',
})

function EventList({ events, muted }: { events: AdminEventData[]; muted?: boolean }) {
  const c = tr.admin.events
  return (
    <ul className="grid gap-3 sm:grid-cols-2">
      {events.map((event) => (
        <li key={event.id}>
          <Link
            href={ROUTES.admin.event(event.id)}
            className={cn(
              'flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-accent/40',
              muted && 'opacity-70',
            )}
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate font-medium">{event.title}</p>
                {!event.isActive ? <Badge variant="outline">{c.hidden}</Badge> : null}
              </div>
              <p className="truncate text-xs text-muted-foreground">
                {event.shop?.name ?? tr.campaigns.scopeGlobal}
              </p>
              <p className="text-xs text-muted-foreground tabular-nums">
                {dateFormatter.format(event.startsAt)}
                {event.endsAt ? ` – ${dateFormatter.format(event.endsAt)}` : ''}
              </p>
            </div>
            <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        </li>
      ))}
    </ul>
  )
}

export default async function AdminEventsPage() {
  const staff = await requireStaff()
  const { upcoming, past } = await listEventsForStaff(staff)
  const c = tr.admin.events

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <PageHeader
        title={c.title}
        description={staff.role === 'MANAGER' ? c.managerHint : undefined}
        actions={
          <Link href="/admin/etkinlikler/yeni" className={buttonVariants()}>
            <PlusIcon data-icon="inline-start" /> {c.newEvent}
          </Link>
        }
      />
      {upcoming.length === 0 && past.length === 0 ? (
        <p className="text-sm text-muted-foreground">{c.empty}</p>
      ) : null}
      {upcoming.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">{c.upcoming}</h2>
          <EventList events={upcoming} />
        </section>
      ) : null}
      {past.length > 0 ? (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground">{c.past}</h2>
          <EventList events={past} muted />
        </section>
      ) : null}
    </div>
  )
}
