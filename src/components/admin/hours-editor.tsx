'use client'

import { useState, type FormEvent } from 'react'
import { FormError, SubmitButton } from '@/components/admin/form'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import {
  DAY_NAMES,
  formatHoursEntry,
  normalizeWeek,
  type DayOfWeek,
  type HoursInput,
} from '@/features/hours'
import type { ActionResult } from '@/lib/actions/result'
import { firstError, useAction } from '@/lib/actions/use-action'
import { tr } from '@/lib/i18n/tr'
import { cn } from '@/lib/utils'

interface DayState {
  dayOfWeek: DayOfWeek
  isClosed: boolean
  opensAt: string
  closesAt: string
}

interface HoursEditorProps {
  initialHours: HoursInput[]
  /** Devralınabilecek mekan saatleri (dükkan için). Mekan düzenlenirken null. */
  inherited: { name: string; hours: HoursInput[] } | null
  useOwnLabel: string
  hint: string
  saveAction: (input: unknown) => Promise<ActionResult<null>>
}

const DAYS: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 7]
const DEFAULT_OPEN = '09:00'
const DEFAULT_CLOSE = '22:00'

function toState(hours: HoursInput[]): DayState[] {
  const byDay = new Map(hours.map((h) => [h.dayOfWeek, h]))
  return DAYS.map((day) => {
    const h = byDay.get(day)
    return {
      dayOfWeek: day,
      isClosed: h?.isClosed ?? false,
      opensAt: h?.opensAt ?? DEFAULT_OPEN,
      closesAt: h?.closesAt ?? DEFAULT_CLOSE,
    }
  })
}

export function HoursEditor({
  initialHours,
  inherited,
  useOwnLabel,
  hint,
  saveAction,
}: HoursEditorProps) {
  const [useOwn, setUseOwn] = useState(initialHours.length > 0)
  const [days, setDays] = useState<DayState[]>(() => toState(initialHours))
  const save = useAction(saveAction, { successMessage: tr.admin.hours.saved })

  function updateDay(day: DayOfWeek, patch: Partial<DayState>) {
    setDays((prev) => prev.map((d) => (d.dayOfWeek === day ? { ...d, ...patch } : d)))
  }

  function applyMondayToAll() {
    const monday = days[0]
    if (!monday) return
    setDays((prev) =>
      prev.map((d) => ({
        ...d,
        isClosed: monday.isClosed,
        opensAt: monday.opensAt,
        closesAt: monday.closesAt,
      })),
    )
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void save.run({
      useOwnHours: useOwn,
      days: days.map((d) => ({
        dayOfWeek: d.dayOfWeek,
        isClosed: d.isClosed,
        opensAt: d.isClosed ? null : d.opensAt || null,
        closesAt: d.isClosed ? null : d.closesAt || null,
      })),
    })
  }

  const inheritedWeek =
    inherited && inherited.hours.length > 0 ? normalizeWeek(inherited.hours) : []

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <FormError error={save.error} />

      <label className="flex items-start gap-3">
        <Switch checked={useOwn} onCheckedChange={setUseOwn} className="mt-0.5" />
        <span>
          <span className="block text-sm font-medium">{useOwnLabel}</span>
          <span className="block text-xs text-muted-foreground">{hint}</span>
        </span>
      </label>

      {useOwn ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">{tr.admin.hours.overnightHint}</p>
            <Button type="button" variant="outline" size="sm" onClick={applyMondayToAll}>
              {tr.admin.hours.applyMondayToAll}
            </Button>
          </div>
          <ul className="divide-y rounded-xl border">
            {days.map((day, index) => (
              <li
                key={day.dayOfWeek}
                className={cn(
                  'grid grid-cols-[1fr_auto] items-center gap-3 p-3 sm:grid-cols-[8rem_auto_1fr_1fr]',
                  day.isClosed && 'opacity-70',
                )}
              >
                <span className="font-medium">{DAY_NAMES[day.dayOfWeek]}</span>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={day.isClosed}
                    onCheckedChange={(checked) =>
                      updateDay(day.dayOfWeek, { isClosed: checked === true })
                    }
                  />
                  {tr.admin.hours.closed}
                </label>
                <label className="col-span-2 flex items-center gap-2 text-sm sm:col-span-1">
                  <span className="w-14 text-muted-foreground sm:sr-only">
                    {tr.admin.hours.opens}
                  </span>
                  <Input
                    type="time"
                    value={day.opensAt}
                    disabled={day.isClosed}
                    onChange={(e) => updateDay(day.dayOfWeek, { opensAt: e.target.value })}
                    className="h-10"
                    aria-label={`${DAY_NAMES[day.dayOfWeek]} ${tr.admin.hours.opens}`}
                    aria-invalid={Boolean(firstError(save.fieldErrors, `days.${index}.opensAt`))}
                  />
                </label>
                <label className="col-span-2 flex items-center gap-2 text-sm sm:col-span-1">
                  <span className="w-14 text-muted-foreground sm:sr-only">
                    {tr.admin.hours.closes}
                  </span>
                  <Input
                    type="time"
                    value={day.closesAt}
                    disabled={day.isClosed}
                    onChange={(e) => updateDay(day.dayOfWeek, { closesAt: e.target.value })}
                    className="h-10"
                    aria-label={`${DAY_NAMES[day.dayOfWeek]} ${tr.admin.hours.closes}`}
                  />
                </label>
              </li>
            ))}
          </ul>
        </div>
      ) : inheritedWeek.length > 0 && inherited ? (
        <div className="rounded-xl border p-4">
          <p className="mb-2 text-sm font-medium">
            {tr.admin.hours.inheritedPreview(inherited.name)}
          </p>
          <dl className="divide-y text-sm">
            {inheritedWeek.map((entry) => (
              <div key={entry.dayOfWeek} className="flex justify-between py-1.5">
                <dt>{DAY_NAMES[entry.dayOfWeek]}</dt>
                <dd className="text-muted-foreground tabular-nums">{formatHoursEntry(entry)}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{tr.common.hoursUnknown}</p>
      )}

      <div className="flex justify-end border-t pt-6">
        <SubmitButton pending={save.pending} />
      </div>
    </form>
  )
}
