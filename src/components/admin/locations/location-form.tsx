'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Field, FormError, NativeSelect, SubmitButton } from '@/components/admin/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { AdminLocation } from '@/features/locations/admin-queries'
import { createLocationAction, updateLocationAction } from '@/features/locations/actions'
import { firstError, useAction } from '@/lib/actions/use-action'
import { ROUTES } from '@/lib/constants/routes'
import { tr } from '@/lib/i18n/tr'
import { slugify } from '@/lib/utils/slugify'

interface LocationFormProps {
  mode: 'create' | 'edit'
  location?: AdminLocation
}

const f = tr.admin.locations.fields

export function LocationForm({ mode, location }: LocationFormProps) {
  const router = useRouter()
  const [state, setState] = useState({
    name: location?.name ?? '',
    slug: location?.slug ?? '',
    kind: location?.kind ?? 'VENUE',
    description: location?.description ?? '',
    address: location?.address ?? '',
    mapUrl: location?.mapUrl ?? '',
    phone: location?.phone ?? '',
    whatsapp: location?.whatsapp ?? '',
    instagramUrl: location?.instagramUrl ?? '',
    isActive: location?.isActive ?? true,
    sortOrder: String(location?.sortOrder ?? 0),
  })
  const [slugTouched, setSlugTouched] = useState(mode === 'edit')

  const create = useAction(createLocationAction, {
    successMessage: tr.admin.locations.created,
    onSuccess: (created) => router.push(ROUTES.admin.location(created.id)),
  })
  const update = useAction((input: unknown) => updateLocationAction(location?.id ?? '', input), {
    successMessage: tr.admin.locations.saved,
    onSuccess: () => router.refresh(),
  })
  const action = mode === 'create' ? create : update
  const err = (key: string) => firstError(action.fieldErrors, key)
  const isVenue = state.kind === 'VENUE'

  function set<K extends keyof typeof state>(key: K, value: (typeof state)[K]) {
    setState((prev) => ({ ...prev, [key]: value }))
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void action.run({ ...state, sortOrder: Number(state.sortOrder) })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8" noValidate>
      <FormError error={action.error} />
      <section className="grid gap-5 sm:grid-cols-2">
        <Field label={f.name} htmlFor="name" error={err('name')}>
          <Input
            id="name"
            value={state.name}
            onChange={(e) => {
              set('name', e.target.value)
              if (!slugTouched) set('slug', slugify(e.target.value))
            }}
            className="h-10"
            required
          />
        </Field>
        <Field
          label={f.slug}
          htmlFor="slug"
          error={err('slug')}
          hint={`/mekan/${state.slug || '…'}`}
        >
          <Input
            id="slug"
            value={state.slug}
            onChange={(e) => {
              setSlugTouched(true)
              set('slug', e.target.value)
            }}
            className="h-10 font-mono text-sm"
            autoCapitalize="off"
          />
        </Field>
        <Field label={f.kind} htmlFor="kind" error={err('kind')} className="sm:col-span-2">
          <NativeSelect
            id="kind"
            value={state.kind}
            onChange={(e) => set('kind', e.target.value as 'VENUE' | 'DISTRICT')}
          >
            <option value="VENUE">{f.kindVenue}</option>
            <option value="DISTRICT">{f.kindDistrict}</option>
          </NativeSelect>
        </Field>
        <Field
          label={f.description}
          htmlFor="description"
          error={err('description')}
          optional
          className="sm:col-span-2"
        >
          <Textarea
            id="description"
            rows={4}
            value={state.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </Field>
        <Field label={f.sortOrder} htmlFor="sortOrder" error={err('sortOrder')}>
          <Input
            id="sortOrder"
            type="number"
            inputMode="numeric"
            min={0}
            value={state.sortOrder}
            onChange={(e) => set('sortOrder', e.target.value)}
            className="h-10"
          />
        </Field>
      </section>

      {isVenue ? (
        <section className="grid gap-5 sm:grid-cols-2">
          <h2 className="text-lg font-semibold sm:col-span-2">{tr.shop.contact}</h2>
          <Field
            label={f.address}
            htmlFor="address"
            error={err('address')}
            optional
            className="sm:col-span-2"
          >
            <Input
              id="address"
              value={state.address}
              onChange={(e) => set('address', e.target.value)}
              className="h-10"
            />
          </Field>
          <Field label={f.mapUrl} htmlFor="mapUrl" error={err('mapUrl')} optional>
            <Input
              id="mapUrl"
              type="url"
              value={state.mapUrl}
              onChange={(e) => set('mapUrl', e.target.value)}
              className="h-10"
              placeholder="https://maps.google.com/…"
            />
          </Field>
          <Field label={f.instagramUrl} htmlFor="instagramUrl" error={err('instagramUrl')} optional>
            <Input
              id="instagramUrl"
              type="url"
              value={state.instagramUrl}
              onChange={(e) => set('instagramUrl', e.target.value)}
              className="h-10"
            />
          </Field>
          <Field label={f.phone} htmlFor="phone" error={err('phone')} optional>
            <Input
              id="phone"
              type="tel"
              value={state.phone}
              onChange={(e) => set('phone', e.target.value)}
              className="h-10"
              placeholder="05xx xxx xx xx"
            />
          </Field>
          <Field label={f.whatsapp} htmlFor="whatsapp" error={err('whatsapp')} optional>
            <Input
              id="whatsapp"
              type="tel"
              value={state.whatsapp}
              onChange={(e) => set('whatsapp', e.target.value)}
              className="h-10"
              placeholder="05xx xxx xx xx"
            />
          </Field>
        </section>
      ) : null}

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
