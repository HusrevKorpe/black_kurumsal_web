'use client'

import { PlusIcon, Trash2Icon } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { Field, FormError, inputClass } from '@/components/admin/form'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { formatDateKey, formatHoursEntry, type HoursExceptionEntry } from '@/features/hours'
import type { ActionResult } from '@/lib/actions/result'
import { firstError, useAction } from '@/lib/actions/use-action'
import { tr } from '@/lib/i18n/tr'

/** Kaydı silebilmek için kimliği de gerekir; sitede kullanılan girdi tipine kimlik eklenir. */
export interface AdminHoursException extends HoursExceptionEntry {
  id: string
}

interface HoursExceptionsEditorProps {
  exceptions: AdminHoursException[]
  /** Saatler devralınıyorsa düzenleme kapalıdır; devralınan özel günler yalnızca gösterilir. */
  readOnlyNote: string | null
  saveAction: (input: unknown) => Promise<ActionResult<null>>
  deleteAction: (exceptionId: string) => Promise<ActionResult<null>>
}

const DEFAULT_OPEN = '10:00'
const DEFAULT_CLOSE = '18:00'

export function HoursExceptionsEditor({
  exceptions,
  readOnlyNote,
  saveAction,
  deleteAction,
}: HoursExceptionsEditorProps) {
  const e = tr.admin.hours.exceptions
  const [date, setDate] = useState('')
  const [isClosed, setIsClosed] = useState(true)
  const [opensAt, setOpensAt] = useState(DEFAULT_OPEN)
  const [closesAt, setClosesAt] = useState(DEFAULT_CLOSE)
  const [note, setNote] = useState('')
  const [pendingRemove, setPendingRemove] = useState<AdminHoursException | null>(null)

  const save = useAction(saveAction, {
    successMessage: e.saved,
    onSuccess: () => {
      setDate('')
      setNote('')
    },
  })
  const remove = useAction(deleteAction, {
    successMessage: e.removed,
    onSuccess: () => setPendingRemove(null),
  })

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void save.run({
      date,
      isClosed,
      opensAt: isClosed ? null : opensAt || null,
      closesAt: isClosed ? null : closesAt || null,
      note: note.trim() === '' ? null : note.trim(),
    })
  }

  return (
    <section aria-labelledby="ozel-gunler" className="space-y-4 border-t pt-6">
      <div>
        <h2 id="ozel-gunler" className="font-semibold">
          {e.title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{readOnlyNote ?? e.description}</p>
      </div>

      {exceptions.length === 0 ? (
        <p className="text-sm text-muted-foreground">{e.empty}</p>
      ) : (
        <ul className="divide-y rounded-xl border">
          {exceptions.map((exception) => (
            <li key={exception.id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{formatDateKey(exception.date)}</p>
                <p className="text-xs text-muted-foreground">
                  {formatHoursEntry(exception)}
                  {exception.note ? ` · ${exception.note}` : ''}
                </p>
              </div>
              {readOnlyNote ? null : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  aria-label={`${formatDateKey(exception.date)} — ${e.remove}`}
                  onClick={() => setPendingRemove(exception)}
                >
                  <Trash2Icon className="size-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {readOnlyNote ? null : (
        <form onSubmit={onSubmit} className="space-y-4 rounded-xl border p-4" noValidate>
          <FormError error={save.error} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={e.date}
              htmlFor="exception-date"
              error={firstError(save.fieldErrors, 'date')}
            >
              <Input
                id="exception-date"
                type="date"
                required
                value={date}
                onChange={(event) => setDate(event.target.value)}
                className={inputClass}
                aria-invalid={Boolean(firstError(save.fieldErrors, 'date'))}
              />
            </Field>
            <Field label={e.note} htmlFor="exception-note" optional>
              <Input
                id="exception-note"
                value={note}
                maxLength={80}
                placeholder={e.notePlaceholder}
                onChange={(event) => setNote(event.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={isClosed}
              onCheckedChange={(checked) => setIsClosed(checked === true)}
            />
            {e.closedAllDay}
          </label>

          {isClosed ? null : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label={tr.admin.hours.opens}
                htmlFor="exception-opens"
                error={firstError(save.fieldErrors, 'opensAt')}
              >
                <Input
                  id="exception-opens"
                  type="time"
                  value={opensAt}
                  onChange={(event) => setOpensAt(event.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label={tr.admin.hours.closes} htmlFor="exception-closes">
                <Input
                  id="exception-closes"
                  type="time"
                  value={closesAt}
                  onChange={(event) => setClosesAt(event.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">{e.overwriteHint}</p>
            <Button type="submit" disabled={save.pending || date === ''}>
              <PlusIcon data-icon="inline-start" />
              {save.pending ? tr.common.saving : e.add}
            </Button>
          </div>
        </form>
      )}

      <ConfirmDialog
        open={pendingRemove !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemove(null)
        }}
        title={e.removeTitle}
        description={pendingRemove ? e.removeText(formatDateKey(pendingRemove.date)) : ''}
        pending={remove.pending}
        onConfirm={() => {
          if (pendingRemove) void remove.run(pendingRemove.id)
        }}
      />
    </section>
  )
}
