import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/admin/page-header'
import { buttonVariants } from '@/components/ui/button'
import { listAuditLogs } from '@/features/audit/queries'
import { requireOwner } from '@/lib/auth/session'
import { tr } from '@/lib/i18n/tr'
import { cn } from '@/lib/utils'

export const metadata: Metadata = { title: tr.admin.audit.title, robots: { index: false } }

const dateTime = new Intl.DateTimeFormat('tr-TR', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Europe/Istanbul',
})

export default async function AuditPage({ searchParams }: PageProps<'/admin/gunluk'>) {
  await requireOwner()
  const params = await searchParams
  const requested = Number(typeof params.sayfa === 'string' ? params.sayfa : 1)
  const { rows, page, totalPages } = await listAuditLogs(requested)
  const a = tr.admin.audit

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader title={a.title} description={a.page(page, totalPages)} />
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{a.empty}</p>
      ) : (
        <ol className="divide-y rounded-xl border">
          {rows.map((row) => (
            <li key={row.id} className="grid gap-1 p-3 text-sm sm:grid-cols-[10rem_1fr_9rem]">
              <span className="truncate font-medium">{row.staff?.fullName ?? a.system}</span>
              <span>{row.summary}</span>
              <time
                dateTime={row.createdAt.toISOString()}
                className="text-muted-foreground tabular-nums sm:text-right"
              >
                {dateTime.format(row.createdAt)}
              </time>
            </li>
          ))}
        </ol>
      )}
      <nav aria-label="Sayfalama" className="mt-4 flex justify-between">
        <Link
          href={`/admin/gunluk?sayfa=${page - 1}`}
          aria-disabled={page <= 1}
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            page <= 1 && 'pointer-events-none opacity-50',
          )}
        >
          ← {a.prev}
        </Link>
        <Link
          href={`/admin/gunluk?sayfa=${page + 1}`}
          aria-disabled={page >= totalPages}
          className={cn(
            buttonVariants({ variant: 'outline', size: 'sm' }),
            page >= totalPages && 'pointer-events-none opacity-50',
          )}
        >
          {a.next} →
        </Link>
      </nav>
    </div>
  )
}
