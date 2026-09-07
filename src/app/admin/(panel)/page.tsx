import { ArrowRightIcon, ImageIcon, MegaphoneIcon, StoreIcon } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/admin/page-header'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { listRecentAuditLogs } from '@/features/audit/queries'
import { getDashboardData } from '@/features/dashboard/queries'
import { isOwner } from '@/lib/auth/authorize'
import { requireStaff } from '@/lib/auth/session'
import { ROUTES } from '@/lib/constants/routes'
import { tr } from '@/lib/i18n/tr'

export const metadata: Metadata = { title: tr.admin.nav.dashboard, robots: { index: false } }

const relative = new Intl.DateTimeFormat('tr-TR', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Europe/Istanbul',
})

export default async function AdminDashboardPage({ searchParams }: PageProps<'/admin'>) {
  const params = await searchParams
  const showForbidden = params.yetki === 'yok'
  const staff = await requireStaff()
  const owner = isOwner(staff)
  const [data, recent] = await Promise.all([
    getDashboardData(staff),
    owner ? listRecentAuditLogs(6) : Promise.resolve([]),
  ])
  const d = tr.admin.dashboard

  const stats = [
    {
      label: owner ? d.allShops : d.yourShops,
      value: d.shopsStat(data.shopsActive, data.shopsTotal),
      icon: StoreIcon,
      href: ROUTES.admin.shops,
    },
    {
      label: d.activeCampaigns,
      value: String(data.liveCampaigns),
      icon: MegaphoneIcon,
      href: ROUTES.admin.campaigns,
    },
    {
      label: d.galleryImages,
      value: String(data.galleryImages),
      icon: ImageIcon,
      href: ROUTES.admin.shops,
    },
  ]

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8">
      <PageHeader title={d.welcome(staff.fullName)} description={tr.admin.roles[staff.role]} />
      {showForbidden ? (
        <Alert variant="destructive">
          <AlertDescription>{tr.errors.unauthorized}</AlertDescription>
        </Alert>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Özet">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-xl border bg-card p-4 transition-colors hover:bg-accent/40"
          >
            <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              <stat.icon className="size-4" /> {stat.label}
            </div>
            <p className="mt-2 text-2xl font-semibold tabular-nums">{stat.value}</p>
          </Link>
        ))}
      </section>

      <section aria-labelledby="dukkanlar">
        <div className="mb-3 flex items-center justify-between">
          <h2 id="dukkanlar" className="text-lg font-semibold">
            {owner ? d.allShops : d.yourShops}
          </h2>
          <Link href={ROUTES.admin.shops} className="text-sm text-brand hover:underline">
            {tr.common.seeAll}
          </Link>
        </div>
        <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {data.shops.map((shop) => (
            <li key={shop.id}>
              <Link
                href={ROUTES.admin.shop(shop.id)}
                className="flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2.5 text-sm transition-colors hover:bg-accent/40"
              >
                <span className="truncate font-medium">{shop.name}</span>
                <span className="flex items-center gap-2">
                  {!shop.isActive ? <Badge variant="outline">{tr.common.inactive}</Badge> : null}
                  <ArrowRightIcon className="size-4 text-muted-foreground" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {owner && recent.length > 0 ? (
        <section aria-labelledby="son-islemler">
          <div className="mb-3 flex items-center justify-between">
            <h2 id="son-islemler" className="text-lg font-semibold">
              {d.recentActivity}
            </h2>
            <Link
              href={ROUTES.admin.audit}
              className={buttonVariants({ variant: 'ghost', size: 'sm' })}
            >
              {tr.common.seeAll}
            </Link>
          </div>
          <ol className="divide-y rounded-xl border text-sm">
            {recent.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-3 py-2"
              >
                <span>
                  <span className="font-medium">
                    {row.staff?.fullName ?? tr.admin.audit.system}
                  </span>
                  <span className="text-muted-foreground"> · {row.summary}</span>
                </span>
                <time
                  dateTime={row.createdAt.toISOString()}
                  className="text-xs text-muted-foreground tabular-nums"
                >
                  {relative.format(row.createdAt)}
                </time>
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  )
}
