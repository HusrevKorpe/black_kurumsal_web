'use client'

import { clsx } from 'clsx'
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
import { useMinuteTick } from './use-minute-tick'

interface HoursTableProps {
  week: WeeklyHours
  /** Haftalık tabloyu ezen günler; tablonun altında ayrı liste olarak görünür. */
  exceptions?: readonly HoursExceptionEntry[]
  /** Saatler mekandan devralındıysa açıklama notu. */
  note?: string
}

/** Haftanın yedi günü de aynı saatle mi açık? */
export function isUniformWeek(week: WeeklyHours): boolean {
  const [head] = week
  if (week.length !== 7 || !head) return false
  const first = formatHoursEntry(head)
  return week.every((entry) => formatHoursEntry(entry) === first)
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

  // Yedi gün aynıysa yedi satır yerine tek satır: "Her gün 11:00 – 23:30". Bugün özel günse
  // tablo açılır ki bugünün farklı saati görünsün.
  const todaySpecial = now ? exceptions?.find((e) => e.date === now.dateKey) : undefined
  const uniformDay = isUniformWeek(week) && !todaySpecial ? week[0] : undefined

  return (
    <div>
      {uniformDay ? (
        <dl className="text-[15px]">
          <div className="-mx-2 flex items-center justify-between bg-accent px-2 py-2 font-semibold">
            <dt>{tr.common.everyDay}</dt>
            <dd className={clsx('tabular-nums', uniformDay.isClosed && 'text-muted-foreground')}>
              {formatHoursEntry(uniformDay)}
            </dd>
          </div>
        </dl>
      ) : (
        <dl className="divide-y text-[15px]">
          {week.map((entry) => {
            const isToday = now?.dayOfWeek === entry.dayOfWeek
            // Bugün özel günse satır onu gösterir: şerit ve durum rozetiyle çelişmesin.
            const special = isToday ? exceptions?.find((e) => e.date === now?.dateKey) : undefined
            const shown = special ?? entry
            return (
              <div
                key={entry.dayOfWeek}
                className={clsx(
                  '-mx-2 flex items-center justify-between px-2 py-2',
                  isToday && 'bg-accent font-semibold',
                )}
              >
                <dt className="flex items-center gap-2">
                  {DAY_NAMES[entry.dayOfWeek]}
                  {isToday ? (
                    <span className="text-xs font-medium text-brand">
                      {special
                        ? `${tr.common.today} · ${special.note ?? tr.common.specialDay}`
                        : tr.common.today}
                    </span>
                  ) : null}
                </dt>
                <dd className={clsx('tabular-nums', shown.isClosed && 'text-muted-foreground')}>
                  {formatHoursEntry(shown)}
                </dd>
              </div>
            )
          })}
        </dl>
      )}

      {upcoming.length > 0 ? (
        <div className="mt-4">
          <p className="mb-2 text-xs font-medium text-muted-foreground">{tr.common.specialDays}</p>
          <dl className="divide-y divide-dashed border-t border-dashed text-sm">
            {upcoming.map((exception) => (
              <div key={exception.date} className="flex items-center justify-between gap-3 py-2">
                <dt className="min-w-0">
                  <span className="block truncate">{formatDateKey(exception.date)}</span>
                  {exception.note ? (
                    <span className="block truncate text-xs text-muted-foreground">
                      {exception.note}
                    </span>
                  ) : null}
                </dt>
                <dd
                  className={clsx(
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
