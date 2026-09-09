import type { Metadata } from 'next'
import { CountList } from '@/components/admin/analytics/count-list'
import { DailyChart } from '@/components/admin/analytics/daily-chart'
import { ShopTable } from '@/components/admin/analytics/shop-table'
import { StatCards } from '@/components/admin/analytics/stat-cards'
import { RangeTabs } from '@/components/admin/analytics/toolbar'
import { PageHeader } from '@/components/admin/page-header'
import { getAnalyticsOverview, type NamedCount } from '@/features/analytics/queries'
import { buildRange, parseRange } from '@/features/analytics/range'
import { parseShopSort, sortShopRows } from '@/features/analytics/view'
import type { AnalyticsEventType } from '@/generated/prisma/enums'
import { REPEAT_WINDOW_SECONDS } from '@/lib/analytics/repeat'
import { requireOwner } from '@/lib/auth/session'
import { tr } from '@/lib/i18n/tr'

export const metadata: Metadata = { title: tr.admin.analytics.title, robots: { index: false } }

/** requireOwner çerez okur, yani sayfa kendiliğinden dinamik: sayaçlar her açılışta günceldir. */
export default async function AnalyticsPage({ searchParams }: PageProps<'/admin/istatistik'>) {
  await requireOwner()
  const params = await searchParams
  const days = parseRange(params.gun)
  const sort = parseShopSort(params.sirala)
  const range = buildRange(new Date(), days)
  const data = await getAnalyticsOverview(range)
  const a = tr.admin.analytics

  const actionRows: NamedCount[] = (Object.entries(data.totals) as [AnalyticsEventType, number][])
    .filter(([type, count]) => type !== 'PAGE_VIEW' && count > 0)
    .map(([type, count]) => ({ key: type, label: a.eventTypes[type], count }))
    .sort((first, second) => second.count - first.count)

  // Kaynağı bilinmeyen görüntülemeler "doğrudan": adres çubuğuna yazan, kaydettiği bağlantıdan
  // gelen ya da yönlendireni gizleyen uygulamalardan (Instagram uygulaması gibi) gelen ziyaretler.
  const knownSources = data.sources.reduce((sum, row) => sum + row.count, 0)
  const sourceRows: NamedCount[] = [...data.sources]
  const direct = data.totals.PAGE_VIEW - knownSources
  if (direct > 0) sourceRows.push({ key: 'dogrudan', label: a.sources.direct, count: direct })

  const deviceRows: NamedCount[] = [
    { key: 'mobile', label: a.devices.mobile, count: data.devices.mobile },
    { key: 'desktop', label: a.devices.desktop, count: data.devices.desktop },
  ].filter((row) => row.count > 0)

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title={a.title}
        description={`${a.description} · ${a.rangeLabel(days)}`}
        actions={<RangeTabs active={days} sort={sort} />}
      />

      {data.isEmpty ? (
        <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">{a.empty}</p>
      ) : (
        <>
          <StatCards totals={data.totals} visitors={data.visitors} />
          <DailyChart daily={data.daily} />
          <ShopTable rows={sortShopRows(data.shops, sort)} sort={sort} days={days} />

          <div className="grid gap-4 lg:grid-cols-2">
            <CountList
              id="sayfalar"
              title={a.pages.title}
              nameHeader={a.pages.path}
              countHeader={a.pages.views}
              rows={data.paths}
              empty={a.empty}
            />
            <CountList
              id="kaynaklar"
              title={a.sources.title}
              nameHeader={a.sources.source}
              countHeader={a.sources.views}
              rows={sourceRows}
              empty={a.empty}
            />
            <CountList
              id="tiklamalar"
              title={a.actions.title}
              nameHeader={a.actions.name}
              countHeader={a.actions.count}
              rows={actionRows}
              empty={a.empty}
            />
            <CountList
              id="cihazlar"
              title={a.devices.title}
              nameHeader={a.devices.title}
              countHeader={a.pages.views}
              rows={deviceRows}
              empty={a.empty}
            />
            {data.locations.length > 0 ? (
              <CountList
                id="mekanlar"
                title={a.locations.title}
                nameHeader={a.locations.name}
                countHeader={a.locations.count}
                rows={data.locations}
                empty={a.empty}
              />
            ) : null}
            {data.campaigns.length > 0 ? (
              <CountList
                id="kampanya-tiklamalari"
                title={a.campaigns.title}
                nameHeader={a.campaigns.name}
                countHeader={a.campaigns.count}
                rows={data.campaigns}
                empty={a.empty}
              />
            ) : null}
          </div>
        </>
      )}

      <div className="space-y-1 text-xs leading-relaxed text-muted-foreground">
        <p>{a.privacy}</p>
        <p>{a.repeatNote(REPEAT_WINDOW_SECONDS)}</p>
      </div>
    </div>
  )
}
