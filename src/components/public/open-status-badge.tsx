'use client'

import { clsx } from 'clsx'
import { useMemo } from 'react'
import {
  CLOSING_SOON_MINUTES,
  DAY_NAMES,
  getOpenStatus,
  minutesUntilClose,
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
  className?: string
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
  className,
}: OpenStatusBadgeProps) {
  const tick = useMinuteTick()
  const view = useMemo(() => {
    if (tick === null) return null
    const now = new Date()
    const status = getOpenStatus(week, { now, exceptions })
    return { status, left: minutesUntilClose(status, { now }) }
  }, [week, exceptions, tick])

  if (week.length === 0) return null

  if (!view) {
    // Yer ayrılır, metin göstermez: gerçek durum gelince satır oynamaz, gri yazı da görünmez.
    return <span aria-hidden className={clsx('inline-block h-[1lh] w-20', className)} />
  }

  const { status, left } = view
  if (status.kind === 'unknown') return null

  const isOpen = status.kind === 'open'
  const soonLeft = left !== null && left <= CLOSING_SOON_MINUTES ? left : null
  const closingSoon = soonLeft !== null
  let detail = ''
  if (detailed) {
    if (status.kind === 'open') {
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
        closingSoon ? 'text-amber-400' : isOpen ? 'text-emerald-400' : 'text-rose-400',
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
