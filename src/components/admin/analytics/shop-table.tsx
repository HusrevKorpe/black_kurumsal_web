import { ArrowDownIcon } from 'lucide-react'
import Link from 'next/link'
import type { ShopStatRow } from '@/features/analytics/queries'
import type { RangeDays } from '@/features/analytics/range'
import type { ShopSortKey } from '@/features/analytics/view'
import { Badge } from '@/components/ui/badge'
import { ROUTES } from '@/lib/constants/routes'
import { tr } from '@/lib/i18n/tr'
import { cn } from '@/lib/utils'

interface ShopTableProps {
  rows: ShopStatRow[]
  sort: ShopSortKey
  days: RangeDays
}

const number = new Intl.NumberFormat('tr-TR')

interface Column {
  label: string
  value: (row: ShopStatRow) => number
  /** Sıralanabilen sütunlar adres çubuğuna bu anahtarı yazar. */
  sortKey?: ShopSortKey
  strong?: boolean
}

/** Dükkan başına bütün sayılar tek tabloda; başlıklar sıralama bağlantısı. */
export function ShopTable({ rows, sort, days }: ShopTableProps) {
  const a = tr.admin.analytics
  const columns: Column[] = [
    { label: a.shops.views, value: (row) => row.totals.PAGE_VIEW, sortKey: 'goruntulenme' },
    { label: a.shops.whatsapp, value: (row) => row.totals.WHATSAPP_CLICK, sortKey: 'whatsapp' },
    { label: a.shops.call, value: (row) => row.totals.CALL_CLICK, sortKey: 'ara' },
    { label: a.shops.directions, value: (row) => row.totals.DIRECTIONS_CLICK },
    { label: a.shops.instagram, value: (row) => row.totals.INSTAGRAM_CLICK },
    { label: a.shops.card, value: (row) => row.totals.SHOP_CARD_CLICK },
    { label: a.shops.gallery, value: (row) => row.totals.GALLERY_OPEN },
    { label: a.shops.interest, value: (row) => row.interactions, sortKey: 'ilgi', strong: true },
  ]

  return (
    <section aria-labelledby="dukkan-istatistik" className="rounded-xl border bg-card p-4">
      <div className="mb-3">
        <h2 id="dukkan-istatistik" className="font-semibold">
          {a.shops.title}
        </h2>
        <p className="text-xs text-muted-foreground">{a.shops.note}</p>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{a.shops.empty}</p>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-[46rem] text-sm">
            <caption className="sr-only">{a.shops.title}</caption>
            <thead>
              <tr className="text-xs text-muted-foreground">
                <th scope="col" className="pb-2 text-left font-medium">
                  {a.shops.name}
                </th>
                {columns.map((column) => (
                  <th
                    key={column.label}
                    scope="col"
                    // aria-sort sütun başlığına ait; bağlantıya konursa axe geçersiz sayar.
                    aria-sort={column.sortKey && sort === column.sortKey ? 'descending' : undefined}
                    className="pb-2 text-right font-medium"
                  >
                    {column.sortKey ? (
                      <Link
                        href={`${ROUTES.admin.analytics}?gun=${days}&sirala=${column.sortKey}`}
                        className={cn(
                          'inline-flex items-center gap-1 hover:text-foreground',
                          sort === column.sortKey && 'text-foreground',
                        )}
                      >
                        {column.label}
                        {sort === column.sortKey ? <ArrowDownIcon className="size-3" /> : null}
                      </Link>
                    ) : (
                      column.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="border-t">
                  <th scope="row" className="py-2 pr-3 text-left font-normal">
                    <Link href={ROUTES.admin.shop(row.id)} className="hover:underline">
                      {row.name}
                    </Link>
                    {row.isDeleted ? (
                      <Badge variant="outline" className="ml-2">
                        {a.shops.deleted}
                      </Badge>
                    ) : !row.isActive ? (
                      <Badge variant="outline" className="ml-2">
                        {tr.common.inactive}
                      </Badge>
                    ) : null}
                  </th>
                  {columns.map((column) => (
                    <td
                      key={column.label}
                      className={cn(
                        'py-2 text-right tabular-nums',
                        column.strong ? 'font-semibold' : 'text-muted-foreground',
                      )}
                    >
                      {number.format(column.value(row))}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
