'use client'

import { useMemo } from 'react'
import {
  DAY_NAMES,
  formatDateKey,
  formatHoursEntry,
  futureExceptions,
  ISTANBUL_TZ,
  zonedNow,
  type HoursExceptionEntry,
  type WeeklyHours,
} from '@/features/hours'
import { tr } from '@/lib/i18n/tr'
import { cn } from '@/lib/utils'
import { useMinuteTick } from './use-minute-tick'

interface HoursTableProps {
  week: WeeklyHours
  /** Haftalık tabloyu ezen günler; tablonun altında ayrı liste olarak görünür. */
  exceptions?: readonly HoursExceptionEntry[]
  /** Saatler mekandan devralındıysa açıklama notu. */
  note?: string
}

export function HoursTable({ week, exceptions, note }: HoursTableProps) {
  const tick = useMinuteTick()
  // "Bugün" ve yaklaşan günler tarayıcıda hesaplanır: sayfa statik üretildiği için sunucu bilemez.
  const now = useMemo(() => (tick === null ? null : zonedNow(new Date(), ISTANBUL_TZ)), [tick])
  const upcoming = useMemo(
    () => (tick === null || !exceptions ? [] : futureExceptions(exceptions, new Date())),
    [exceptions, tick],
  )

  if (week.length === 0) {
    return <p className="text-sm text-muted-foreground">{tr.common.hoursUnknown}</p>
  }

  return (
    <div>
      <dl className="divide-y overflow-hidden rounded-lg border text-sm">
        {week.map((entry) => {
          const isToday = now?.dayOfWeek === entry.dayOfWeek
          return (
            <div
              key={entry.dayOfWeek}
              className={cn(
                'flex items-center justify-between px-3 py-2',
                isToday && 'bg-accent font-semibold',
              )}
            >
              <dt className="flex items-center gap-2">
                {DAY_NAMES[entry.dayOfWeek]}
                {isToday ? (
                  <span className="text-xs font-medium text-brand">{tr.common.today}</span>
                ) : null}
              </dt>
              <dd className={cn('tabular-nums', entry.isClosed && 'text-muted-foreground')}>
                {formatHoursEntry(entry)}
              </dd>
            </div>
          )
        })}
      </dl>

      {upcoming.length > 0 ? (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">{tr.common.specialDays}</p>
          <dl className="divide-y overflow-hidden rounded-lg border border-dashed text-sm">
            {upcoming.map((exception) => (
              <div
                key={exception.date}
                className="flex items-center justify-between gap-3 px-3 py-2"
              >
                <dt className="min-w-0">
                  <span className="block truncate">{formatDateKey(exception.date)}</span>
                  {exception.note ? (
                    <span className="block truncate text-xs text-muted-foreground">
                      {exception.note}
                    </span>
                  ) : null}
                </dt>
                <dd
                  className={cn(
                    'shrink-0 tabular-nums',
                    exception.isClosed && 'text-muted-foreground',
                  )}
                >
                  {formatHoursEntry(exception)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}

      {note ? <p className="mt-2 text-xs text-muted-foreground">{note}</p> : null}
    </div>
  )
}
