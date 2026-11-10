'use client'

import { clsx } from 'clsx'
import { useMemo } from 'react'
import {
  CLOSING_SOON_MINUTES,
  DAY_NAMES,
  getOpenStatus,
  getTodaySchedule,
  ISTANBUL_TZ,
  minutesUntilClose,
  parseHm,
  zonedNow,
  type HoursExceptionEntry,
  type WeeklyHours,
} from '@/features/hours'
import { tr } from '@/lib/i18n/tr'
import { useMinuteTick } from './use-minute-tick'

interface OpenStatusBadgeProps {
  week: WeeklyHours
  /** Haftalık tabloyu ezen günler (bayram kapanışı gibi). */
  exceptions?: readonly HoursExceptionEntry[]
  /** Kartta kısa, detay sayfasında açıklamalı. */
  detailed?: boolean
  /**
   * Sayfada bugünün saat kutuları (Pafta şeridi) varsa açıkken "Kapanış 02:00" tekrar yazılmaz.
   * Dünün gece yarısını geçen vardiyasındaysa (kutular bugünü gösterir) yine yazılır.
   */
  omitTodayClose?: boolean
  /**
   * Saat girilmemişse yazılacak nötr metin (gri nokta ile). Verilmezse rozet hiç çıkmaz. Liste
   * kartlarında yan yana dükkanlardan birinde durum yazıp ötekinde boş kalmasın diye.
   */
  fallback?: string
  className?: string
}

function NeutralBadge({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium text-muted-foreground',
        className,
      )}
    >
      <span className="size-2 shrink-0 rounded-full border border-current" aria-hidden />
      {label}
    </span>
  )
}

/**
 * Sayfalar statik üretildiği için "şu an" tarayıcıda hesaplanır.
 * Sunucuda boş yer tutar, yüklendikten sonra gerçek durum gelir ve her dakika yenilenir.
 * Açıkken nokta nefes alır; kapanışa bir saat kala kehribara döner, daha sık atar ve kalan
 * dakikayı söyler (globals.css `.status-dot`).
 */
export function OpenStatusBadge({
  week,
  exceptions,
  detailed = false,
  omitTodayClose = false,
  fallback,
  className,
}: OpenStatusBadgeProps) {
  const tick = useMinuteTick()
  const view = useMemo(() => {
    if (tick === null) return null
    const now = new Date()
    const status = getOpenStatus(week, { now, exceptions })
    const today = omitTodayClose ? getTodaySchedule(week, { now, exceptions }) : null
    // Bugünün açılışı geçmediyse dünün vardiyasındayız: kutulardaki kapanış o vardiyanın değil.
    const closeShownElsewhere =
      status.kind === 'open' &&
      today?.kind === 'open' &&
      today.closesAt === status.closesAt &&
      (parseHm(today.opensAt) ?? 0) <= zonedNow(now, ISTANBUL_TZ).minutes
    return { status, left: minutesUntilClose(status, { now }), closeShownElsewhere }
  }, [week, exceptions, tick, omitTodayClose])

  if (week.length === 0) {
    return fallback ? <NeutralBadge label={fallback} className={className} /> : null
  }

  if (!view) {
    // Yer ayrılır, metin göstermez: gerçek durum gelince satır oynamaz, gri yazı da görünmez.
    return <span aria-hidden className={clsx('inline-block h-[1lh] w-20', className)} />
  }

  const { status, left, closeShownElsewhere } = view
  if (status.kind === 'unknown') {
    return fallback ? <NeutralBadge label={fallback} className={className} /> : null
  }

  const isOpen = status.kind === 'open'
  const soonLeft = left !== null && left <= CLOSING_SOON_MINUTES ? left : null
  const closingSoon = soonLeft !== null
  let detail = ''
  if (detailed) {
    if (status.kind === 'open') {
      if (closeShownElsewhere) detail = ''
      else
        detail = status.closesAt
          ? ` · ${tr.common.closesAt} ${status.closesAt}`
          : ` · ${tr.common.allDay}`
    } else if (status.nextOpen) {
      detail = ` · ${tr.common.opensAt} ${DAY_NAMES[status.nextOpen.dayOfWeek]} ${status.nextOpen.opensAt}`
    }
  }

  let label: string = tr.common.closedNow
  if (soonLeft !== null) label = tr.common.closingIn(soonLeft)
  else if (isOpen) label = tr.common.openNow

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium',
        // Açık zeminde koyu, koyu zeminde parlak ton: ikisinde de 4,5:1'in üstü.
        closingSoon
          ? 'text-amber-800 dark:text-amber-400'
          : isOpen
            ? 'text-emerald-700 dark:text-emerald-400'
            : 'text-rose-700 dark:text-rose-400',
        className,
      )}
    >
      <span
        className="status-dot size-2 shrink-0 rounded-full bg-current"
        data-pulse={closingSoon ? 'fast' : isOpen ? 'slow' : undefined}
        aria-hidden
      />
      {label}
      {detail}
    </span>
  )
}
