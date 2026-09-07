import { ExternalLinkIcon } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { LocationTabs } from '@/components/admin/locations/location-tabs'
import { PageHeader } from '@/components/admin/page-header'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { getLocationForAdmin } from '@/features/locations/admin-queries'
import { requireOwner } from '@/lib/auth/session'
import { ROUTES } from '@/lib/constants/routes'
import { tr } from '@/lib/i18n/tr'

export default async function LocationAdminLayout({
  children,
  params,
}: LayoutProps<'/admin/mekanlar/[id]'>) {
  const { id } = await params
  await requireOwner()
  const location = await getLocationForAdmin(id)
  if (!location) notFound()

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        title={location.name}
        breadcrumb={
          <Link href={ROUTES.admin.locations} className="hover:text-foreground">
            ← {tr.admin.locations.title}
          </Link>
        }
        description={`${location.kind === 'VENUE' ? tr.location.venue : tr.location.district} · ${tr.admin.locations.shopCount(location._count.shops)}`}
        actions={
          <>
            {!location.isActive ? <Badge variant="outline">{tr.common.inactive}</Badge> : null}
            <Link
              href={ROUTES.location(location.slug)}
              target="_blank"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              <ExternalLinkIcon data-icon="inline-start" /> {tr.admin.locations.viewOnSite}
            </Link>
          </>
        }
      />
      <LocationTabs locationId={location.id} isVenue={location.kind === 'VENUE'} />
      <div className="mt-6">{children}</div>
    </div>
  )
}
