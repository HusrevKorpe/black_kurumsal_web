import type { DailyPoint } from '@/features/analytics/queries'
import { tr } from '@/lib/i18n/tr'

interface DailyChartProps {
  daily: DailyPoint[]
}

const dayLabel = new Intl.DateTimeFormat('tr-TR', {
  timeZone: 'UTC',
  day: 'numeric',
  month: 'short',
})

function formatDay(dayKey: string): string {
  return dayLabel.format(new Date(`${dayKey}T00:00:00.000Z`))
}

/**
 * Günlük sütun grafiği. Grafik kütüphanesi yüklenmez: yükseklikler yüzde olarak verilir,
 * her sütun ekran okuyucuya kendi sayısını söyler.
 */
export function DailyChart({ daily }: DailyChartProps) {
  const a = tr.admin.analytics
  const max = Math.max(1, ...daily.map((point) => point.views + point.interactions))

  return (
    <section aria-labelledby="gunluk" className="rounded-xl border bg-card p-4">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 id="gunluk" className="font-semibold">
          {a.daily.title}
        </h2>
        <p className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-brand" aria-hidden /> {a.daily.views}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-muted-foreground/60" aria-hidden />{' '}
            {a.daily.interactions}
          </span>
        </p>
      </div>
      <ul className="flex h-40 items-end gap-px">
        {daily.map((point) => {
          const total = point.views + point.interactions
          return (
            <li
              key={point.dayKey}
              className="flex h-full flex-1 flex-col justify-end"
              title={`${formatDay(point.dayKey)}: ${point.views} ${a.daily.views.toLowerCase()}, ${point.interactions} ${a.daily.interactions.toLowerCase()}`}
            >
              <span className="sr-only">
                {formatDay(point.dayKey)}: {point.views} {a.daily.views}, {point.interactions}{' '}
                {a.daily.interactions}
              </span>
              <span
                aria-hidden
                className="w-full rounded-t-[2px] bg-muted-foreground/60"
                style={{ height: `${(point.interactions / max) * 100}%` }}
              />
              <span
                aria-hidden
                className="w-full bg-brand"
                style={{ height: `${(point.views / max) * 100}%` }}
              />
              {total === 0 ? <span aria-hidden className="h-px w-full bg-border" /> : null}
            </li>
          )
        })}
      </ul>
      <div className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{daily.length > 0 ? formatDay(daily[0]!.dayKey) : ''}</span>
        <span>{daily.length > 0 ? formatDay(daily[daily.length - 1]!.dayKey) : ''}</span>
      </div>
    </section>
  )
}
