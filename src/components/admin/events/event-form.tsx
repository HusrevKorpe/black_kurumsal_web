'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Field, FormError, NativeSelect, SubmitButton } from '@/components/admin/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { createEventAction, updateEventAction } from '@/features/events/actions'
import type { AdminEventData } from '@/features/events/admin-queries'
import { firstError, useAction } from '@/lib/actions/use-action'
import { ROUTES } from '@/lib/constants/routes'
import { tr } from '@/lib/i18n/tr'
import { dateToLocalInput, localInputToIso } from '@/lib/utils/datetime'

interface EventFormProps {
  mode: 'create' | 'edit'
  event?: AdminEventData
  shops: { id: string; name: string }[]
  isOwner: boolean
}

const f = tr.admin.events.fields
const ALL = ''

export function EventForm({ mode, event, shops, isOwner }: EventFormProps) {
  const router = useRouter()
  const [state, setState] = useState({
    title: event?.title ?? '',
    description: event?.description ?? '',
    // Patron için varsayılan genel; sorumlunun genel seçeneği yok, ilk dükkanı seçili gelir.
    shopId: event ? (event.shopId ?? ALL) : isOwner ? ALL : (shops[0]?.id ?? ALL),
    startsAt: dateToLocalInput(event?.startsAt),
    endsAt: dateToLocalInput(event?.endsAt),
    isActive: event?.isActive ?? true,
  })

  const create = useAction(createEventAction, {
    successMessage: tr.admin.events.created,
    onSuccess: () => router.push(ROUTES.admin.events),
  })
  const update = useAction((input: unknown) => updateEventAction(event?.id ?? '', input), {
    successMessage: tr.admin.events.saved,
    onSuccess: () => router.refresh(),
  })
  const action = mode === 'create' ? create : update
  const err = (key: string) => firstError(action.fieldErrors, key)

  function set<K extends keyof typeof state>(key: K, value: (typeof state)[K]) {
    setState((prev) => ({ ...prev, [key]: value }))
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    void action.run({
      title: state.title,
      description: state.description,
      shopId: state.shopId || null,
      startsAt: localInputToIso(state.startsAt) ?? '',
      endsAt: localInputToIso(state.endsAt) ?? '',
      isActive: state.isActive,
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8" noValidate>
      <FormError error={action.error} />

      <section className="space-y-5">
        <Field label={f.title} htmlFor="title" error={err('title')} hint={f.titleHint}>
          <Input
            id="title"
            value={state.title}
            onChange={(e) => set('title', e.target.value)}
            className="h-10"
            required
            maxLength={80}
          />
        </Field>
        <Field label={f.description} htmlFor="description" error={err('description')} optional>
          <Textarea
            id="description"
            rows={2}
            value={state.description}
            onChange={(e) => set('description', e.target.value)}
            maxLength={300}
          />
        </Field>
        <Field label={f.shop} htmlFor="shopId" error={err('shopId')}>
          <NativeSelect
            id="shopId"
            value={state.shopId}
            onChange={(e) => set('shopId', e.target.value)}
          >
            {isOwner ? <option value={ALL}>{f.shopAll}</option> : null}
            {shops.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
      </section>

      <section className="grid gap-5 sm:grid-cols-2">
        <Field label={f.startsAt} htmlFor="startsAt" error={err('startsAt')} hint={f.datesHint}>
          <Input
            id="startsAt"
            type="datetime-local"
            value={state.startsAt}
            onChange={(e) => set('startsAt', e.target.value)}
            className="h-10"
            required
          />
        </Field>
        <Field label={f.endsAt} htmlFor="endsAt" error={err('endsAt')} optional hint={f.endsAtHint}>
          <Input
            id="endsAt"
            type="datetime-local"
            value={state.endsAt}
            min={state.startsAt || undefined}
            onChange={(e) => set('endsAt', e.target.value)}
            className="h-10"
          />
        </Field>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-6">
        <label className="flex items-center gap-3 text-sm font-medium">
          <Switch
            checked={state.isActive}
            onCheckedChange={(checked) => set('isActive', checked)}
          />{' '}
          {f.isActive}
        </label>
        <SubmitButton pending={action.pending} />
      </div>
    </form>
  )
}
