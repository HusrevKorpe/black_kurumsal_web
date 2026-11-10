'use client'

import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import Link from 'next/link'
import { useMemo, useRef, useState } from 'react'
import {
  addMonths,
  CALENDAR_TIME_ZONE,
  dayKey,
  groupByDay,
  monthGrid,
  type DayKey,
  type MonthRef,
} from '@/features/events/calendar'
import type { PublicEvent } from '@/features/events/queries'
import { ROUTES } from '@/lib/constants/routes'
import { tr } from '@/lib/i18n/tr'
import { cn } from '@/lib/utils'
import { useMinuteTick } from './use-minute-tick'

const t = tr.events

const monthTitle = new Intl.DateTimeFormat('tr-TR', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})
const fullDate = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  weekday: 'long',
  timeZone: 'UTC',
})
const timeOf = new Intl.DateTimeFormat('tr-TR', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: CALENDAR_TIME_ZONE,
})
const monthShort = new Intl.DateTimeFormat('tr-TR', { month: 'short', timeZone: 'UTC' })
const weekdayShort = new Intl.DateTimeFormat('tr-TR', { weekday: 'short', timeZone: 'UTC' })

/** "2026-11-06" → o günün UTC gece yarısı; yalnız ad/gün biçimlemek için. */
const keyDate = (key: DayKey) => new Date(`${key}T00:00:00Z`)

/** Kaç ay geri/ileri gezilebilir: sunucu geçen aydan ~6 ay sonrasına kadar veri yollar. */
const MONTHS_BACK = 1
const MONTHS_AHEAD = 6
const UPCOMING_LIMIT = 5

interface EventCalendarProps {
  events: PublicEvent[]
  /** Sunucudaki "bugün"; sayfa önbellekte bekleyebileceği için istemcide tazelenir. */
  initialToday: DayKey
}

export function EventCalendar({ events, initialToday }: EventCalendarProps) {
  // Sayfa önbellekte bekleyebilir: tarayıcıda bugün gerçek saatten hesaplanır.
  const tick = useMinuteTick()
  const today = tick === null ? initialToday : dayKey(new Date(tick * 60_000))
  const baseMonth: MonthRef = useMemo(() => {
    const [y, m] = today.split('-')
    return { year: Number(y), month: Number(m) }
  }, [today])
  // Ay, bugünün ayına göre kayma olarak tutulur; gün dönünce taban kendiliğinden kayar.
  const [offset, setOffset] = useState(0)
  const month = useMemo(() => addMonths(baseMonth, offset), [baseMonth, offset])
  const [selected, setSelected] = useState<DayKey | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const byDay = useMemo(() => groupByDay(events), [events])
  const cells = useMemo(() => monthGrid(month), [month])
  const upcoming = useMemo(
    () =>
      events
        .filter((e) => dayKey(new Date(e.endsAt ?? e.startsAt)) >= today)
        .slice(0, UPCOMING_LIMIT),
    [events, today],
  )

  const canPrev = offset > -MONTHS_BACK
  const canNext = offset < MONTHS_AHEAD
  const isBaseMonth = offset === 0

  function go(delta: number) {
    setOffset((o) => o + delta)
    setSelected(null)
  }

  const selectedEvents = selected ? (byDay.get(selected) ?? []) : null
  const title = monthTitle.format(new Date(Date.UTC(month.year, month.month - 1, 1)))

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem] lg:gap-8">
      <div className="overflow-hidden border bg-card">
        <div className="flex items-center gap-2 border-b px-3 py-2 sm:px-5 sm:py-3">
          <CalendarDaysIcon className="size-5 shrink-0 text-brand" aria-hidden />
          <h3
            className="font-display text-2xl leading-none font-bold uppercase sm:text-3xl"
            aria-live="polite"
          >
            {title}
          </h3>
          <div className="ml-auto flex items-center gap-1">
            {!isBaseMonth || selected ? (
              <button
                type="button"
                onClick={() => {
                  setOffset(0)
                  setSelected(null)
                }}
                className="inline-flex h-9 items-center border border-brand/50 px-3 text-sm font-medium text-brand transition-colors hover:bg-brand/10"
              >
                {t.today}
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => go(-1)}
              disabled={!canPrev}
              aria-label={t.prevMonth}
              className="inline-flex size-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
            >
              <ChevronLeftIcon className="size-5" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              disabled={!canNext}
              aria-label={t.nextMonth}
              className="inline-flex size-11 items-center justify-center text-muted-foreground transition-colors hover:text-foreground disabled:opacity-30"
            >
              <ChevronRightIcon className="size-5" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b text-center" aria-hidden>
          {t.weekdays.map((d) => (
            <span
              key={d}
              className="py-2 text-[11px] font-semibold tracking-widest text-muted-foreground uppercase"
            >
              {d}
            </span>
          ))}
        </div>

        <ol className="grid grid-cols-7">
          {cells.map((cell) => {
            const dayEvents = byDay.get(cell.key) ?? []
            const has = dayEvents.length > 0
            const isToday = cell.key === today
            const isSelected = cell.key === selected
            const isPast = cell.key < today
            const label = t.dayLabel(fullDate.format(keyDate(cell.key)), dayEvents.length)
            const inner = (
              <>
                <span
                  className={cn(
                    'inline-flex size-7 items-center justify-center text-sm tabular-nums',
                    isToday && 'bg-brand font-bold text-brand-foreground',
                    !isToday && has && 'font-bold text-brand',
                  )}
                >
                  {cell.day}
                </span>
                {has ? (
                  <>
                    {/* Telefonda nokta, geniş ekranda başlık. */}
                    <span className="mt-1 flex gap-0.5 sm:hidden" aria-hidden>
                      {dayEvents.slice(0, 3).map((e) => (
                        <span key={e.id} className="size-1.5 rounded-full bg-brand" />
                      ))}
                    </span>
                    <span
                      className="mt-1 hidden w-full min-w-0 flex-col gap-0.5 sm:flex"
                      aria-hidden
                    >
                      {dayEvents.slice(0, 2).map((e) => (
                        <span
                          key={e.id}
                          className="truncate border-l-2 border-brand bg-brand/10 px-1 py-0.5 text-left text-[11px] leading-tight font-medium"
                        >
                          {e.title}
                        </span>
                      ))}
                      {dayEvents.length > 2 ? (
                        <span className="px-1 text-left text-[11px] text-muted-foreground">
                          {t.more(dayEvents.length - 2)}
                        </span>
                      ) : null}
                    </span>
                  </>
                ) : null}
              </>
            )
            const base = cn(
              'flex h-full min-h-11 w-full flex-col items-center p-1 sm:min-h-24 sm:items-start sm:p-1.5',
              !cell.inMonth && 'opacity-35',
              isPast && cell.inMonth && !has && 'text-muted-foreground',
            )
            return (
              <li
                key={cell.key}
                className={cn(
                  'border-r border-b [&:nth-child(7n)]:border-r-0',
                  isSelected && 'bg-brand/15 outline-2 -outline-offset-2 outline-brand',
                )}
              >
                {has ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSelected(isSelected ? null : cell.key)
                      // Telefonda liste takvimin üstünde: seçilen günün etkinlikleri görünsün.
                      if (!isSelected && window.matchMedia('(max-width: 1023px)').matches) {
                        requestAnimationFrame(() =>
                          listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }),
                        )
                      }
                    }}
                    aria-pressed={isSelected}
                    aria-label={label}
                    className={cn(
                      base,
                      'transition-colors hover:bg-brand/10 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
                    )}
                  >
                    {inner}
                  </button>
                ) : (
                  <div className={base} aria-label={label}>
                    {inner}
                  </div>
                )}
              </li>
            )
          })}
        </ol>
      </div>

      {/* Telefonda önce liste: boş ay ızgarası yaklaşan etkinlikleri ekranın altına itmesin. */}
      <div ref={listRef} aria-live="polite" className="scroll-mt-20 max-lg:order-first">
        <div className="mb-3 flex items-baseline justify-between gap-3 border-l-4 border-brand pl-3">
          <h3 className="font-display text-2xl leading-none font-bold uppercase">
            {selected ? fullDate.format(keyDate(selected)) : t.upcoming}
          </h3>
          {selected ? (
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="-my-3 inline-flex min-h-11 shrink-0 items-center text-sm font-medium text-brand hover:underline"
            >
              {t.showUpcoming}
            </button>
          ) : null}
        </div>
        {(selectedEvents ?? upcoming).length === 0 ? (
          <p className="border bg-card p-4 text-sm text-muted-foreground">
            {selected ? t.noneOnDay : t.noUpcoming}
          </p>
        ) : (
          <ul className="space-y-2">
            {(selectedEvents ?? upcoming).map((event) => (
              <EventRow key={event.id} event={event} />
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function EventRow({ event }: { event: PublicEvent }) {
  const start = new Date(event.startsAt)
  const startKey = dayKey(start)
  const endKey = event.endsAt ? dayKey(new Date(event.endsAt)) : startKey
  const d = keyDate(startKey)
  const time = `${timeOf.format(start)}${
    event.endsAt
      ? ` – ${endKey !== startKey ? `${fullDate.format(keyDate(endKey))} ` : ''}${timeOf.format(new Date(event.endsAt))}`
      : ''
  }`

  return (
    <li className="flex gap-3 border bg-card p-3">
      <div className="flex w-12 shrink-0 flex-col items-center justify-center border-r pr-3 text-center">
        <span className="text-[11px] font-semibold text-brand uppercase">
          {monthShort.format(d)}
        </span>
        <span className="font-display text-3xl leading-none font-bold tabular-nums">
          {d.getUTCDate()}
        </span>
        <span className="text-[11px] text-muted-foreground uppercase">
          {weekdayShort.format(d)}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="leading-snug font-semibold">{event.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
          <time dateTime={event.startsAt}>{time}</time>
          {' · '}
          {event.shop ? (
            <Link
              href={ROUTES.shop(event.shop.slug)}
              className="font-medium text-brand hover:underline"
            >
              {event.shop.name}
            </Link>
          ) : (
            t.allShops
          )}
        </p>
        {event.description ? (
          <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{event.description}</p>
        ) : null}
      </div>
    </li>
  )
}
