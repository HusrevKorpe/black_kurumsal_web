import type { NamedCount } from '@/features/analytics/queries'

interface CountListProps {
  id: string
  title: string
  nameHeader: string
  countHeader: string
  rows: NamedCount[]
  empty: string
}

const number = new Intl.NumberFormat('tr-TR')

/** Sayfalar, kaynaklar, kampanyalar… hepsi aynı iki sütunlu liste: ad + sayı, çoktan aza. */
export function CountList({ id, title, nameHeader, countHeader, rows, empty }: CountListProps) {
  const max = Math.max(1, ...rows.map((row) => row.count))

  return (
    <section aria-labelledby={id} className="rounded-xl border bg-card p-4">
      <h2 id={id} className="mb-3 font-semibold">
        {title}
      </h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">{empty}</p>
      ) : (
        <table className="w-full text-sm">
          <caption className="sr-only">{title}</caption>
          <thead>
            <tr className="text-xs text-muted-foreground">
              <th scope="col" className="pb-2 text-left font-medium">
                {nameHeader}
              </th>
              <th scope="col" className="pb-2 text-right font-medium">
                {countHeader}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-t">
                <th scope="row" className="w-full py-2 pr-3 text-left font-normal">
                  {/* Çubuk satırın kendisinde: ayrı bir sütun mobilde yer kaplardı. */}
                  <span className="block break-all">{row.label}</span>
                  <span
                    aria-hidden
                    className="mt-1 block h-1 rounded-full bg-brand/70"
                    style={{ width: `${Math.max(2, (row.count / max) * 100)}%` }}
                  />
                </th>
                <td className="py-2 text-right align-top tabular-nums">
                  {number.format(row.count)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}
