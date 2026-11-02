'use client'

import { clsx } from 'clsx'
import { useMemo } from 'react'
import {
  DAY_NAMES,
  getOpenStatus,
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
 */
export function OpenStatusBadge({
  week,
  exceptions,
  detailed = false,
  className,
}: OpenStatusBadgeProps) {
  const tick = useMinuteTick()
  const status = useMemo(
    () => (tick === null ? null : getOpenStatus(week, { now: new Date(), exceptions })),
    [week, exceptions, tick],
  )

  if (week.length === 0) return null

  if (!status) {
    // Yer ayrılır, metin göstermez: gerçek durum gelince satır oynamaz, gri yazı da görünmez.
    return <span aria-hidden className={clsx('inline-block h-[1lh] w-20', className)} />
  }

  if (status.kind === 'unknown') return null

  const isOpen = status.kind === 'open'
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

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium',
        isOpen ? 'text-emerald-400' : 'text-rose-400',
        className,
      )}
    >
      <span
        className={clsx('size-2 rounded-full', isOpen ? 'bg-emerald-400' : 'bg-rose-400')}
        aria-hidden
      />
      {isOpen ? tr.common.openNow : tr.common.closedNow}
      {detail}
    </span>
  )
}
