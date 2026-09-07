import { ChevronRightIcon, PlusIcon } from 'lucide-react'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { PageHeader } from '@/components/admin/page-header'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { listLocationsForAdmin } from '@/features/locations/admin-queries'
import { requireOwner } from '@/lib/auth/session'
import { ROUTES } from '@/lib/constants/routes'
import { tr } from '@/lib/i18n/tr'
import { mediaPublicUrl } from '@/lib/media/url'

export const metadata: Metadata = { title: tr.admin.locations.title, robots: { index: false } }

export default async function AdminLocationsPage() {
  await requireOwner()
  const locations = await listLocationsForAdmin()
  const l = tr.admin.locations

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title={l.title}
        actions={
          <Link href="/admin/mekanlar/yeni" className={buttonVariants()}>
            <PlusIcon data-icon="inline-start" /> {l.newLocation}
          </Link>
        }
      />
      {locations.length === 0 ? (
        <p className="text-sm text-muted-foreground">{l.empty}</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {locations.map((location) => (
            <li key={location.id}>
              <Link
                href={ROUTES.admin.location(location.id)}
                className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-accent/40"
              >
                <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {location.coverImage ? (
                    <Image
                      src={mediaPublicUrl(location.coverImage)}
                      alt=""
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate font-medium">{location.name}</p>
                    <Badge variant={location.kind === 'VENUE' ? 'default' : 'outline'}>
                      {location.kind === 'VENUE' ? tr.location.venue : tr.location.district}
                    </Badge>
                    {!location.isActive ? (
                      <Badge variant="outline">{tr.common.inactive}</Badge>
                    ) : null}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {l.shopCount(location._count.shops)}
                  </p>
                </div>
                <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
