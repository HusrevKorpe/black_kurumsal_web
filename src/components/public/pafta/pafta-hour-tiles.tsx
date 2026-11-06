'use client'

import { useMemo } from 'react'
import { getTodaySchedule, type HoursExceptionEntry, type WeeklyHours } from '@/features/hours'
import { tr } from '@/lib/i18n/tr'
import { useMinuteTick } from '../use-minute-tick'
import { PaftaTile } from './pafta-tile'

interface PaftaHourTilesProps {
  week: WeeklyHours
  exceptions: readonly HoursExceptionEntry[]
}

/**
 * Bugünün açılış ve kapanışı. Sayfa statik üretildiği için "bugün" tarayıcıda, İstanbul saatiyle
 * hesaplanır (özel günler dahil); sunucuda iki boş kutu yer tutar ki şerit yüklenince oynamasın.
 */
export function PaftaHourTiles({ week, exceptions }: PaftaHourTilesProps) {
  const tick = useMinuteTick()
  const today = useMemo(
    () => (tick === null ? null : getTodaySchedule(week, { now: new Date(), exceptions })),
    [week, exceptions, tick],
  )

  if (week.length === 0) return null
  if (!today) {
    return (
      <>
        <PaftaTile value={' '} label={' '} placeholder />
        <PaftaTile value={' '} label={' '} placeholder />
      </>
    )
  }
  switch (today.kind) {
    case 'unknown':
      return null
    case 'closed':
      return <PaftaTile value={tr.pafta.closed} label={tr.pafta.closedLabel} />
    case 'allDay':
      return <PaftaTile value={tr.pafta.allDay} label={tr.pafta.allDayLabel} />
    case 'open':
      return (
        <>
          <PaftaTile value={today.opensAt} label={tr.pafta.opens} />
          <PaftaTile
            value={today.closesAt}
            label={today.overnight ? tr.pafta.closesNight : tr.pafta.closes}
          />
        </>
      )
  }
}
