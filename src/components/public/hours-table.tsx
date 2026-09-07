'use client'

import { useMemo } from 'react'
import {
  DAY_NAMES,
  formatHoursEntry,
  ISTANBUL_TZ,
  zonedNow,
  type WeeklyHours,
} from '@/features/hours'
import { tr } from '@/lib/i18n/tr'
import { cn } from '@/lib/utils'
import { useMinuteTick } from './use-minute-tick'

interface HoursTableProps {
  week: WeeklyHours
  /** Saatler mekandan devralındıysa açıklama notu. */
  note?: string
}

export function HoursTable({ week, note }: HoursTableProps) {
  const tick = useMinuteTick()
  const today = useMemo(
    () => (tick === null ? null : zonedNow(new Date(), ISTANBUL_TZ).dayOfWeek),
    [tick],
  )

  if (week.length === 0) {
    return <p className="text-sm text-muted-foreground">{tr.common.hoursUnknown}</p>
  }

  return (
    <div>
      <dl className="divide-y overflow-hidden rounded-lg border text-sm">
        {week.map((entry) => {
          const isToday = today === entry.dayOfWeek
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
      {note ? <p className="mt-2 text-xs text-muted-foreground">{note}</p> : null}
    </div>
  )
}
