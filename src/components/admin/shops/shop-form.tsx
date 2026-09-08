'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Field, FormError, NativeSelect, SubmitButton } from '@/components/admin/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { AdminShop, LocationOption } from '@/features/shops/admin-queries'
import { createShopAction, updateShopAction } from '@/features/shops/actions'
import { firstError, useAction } from '@/lib/actions/use-action'
import { ROUTES } from '@/lib/constants/routes'
import { SHOP_TYPE_OPTIONS } from '@/lib/constants/shops'
import { tr } from '@/lib/i18n/tr'
import { slugify } from '@/lib/utils/slugify'
import { FeaturesInput } from './features-input'

interface ShopFormProps {
  mode: 'create' | 'edit'
  shop?: AdminShop
  locations: LocationOption[]
  isOwner: boolean
}

interface FormState {
  name: string
  slug: string
  type: string
  locationId: string
  description: string
  address: string
  mapUrl: string
  phone: string
  whatsapp: string
  instagramUrl: string
  features: string[]
  seoTitle: string
  seoDescription: string
  isActive: boolean
  sortOrder: string
}

function initialState(shop?: AdminShop): FormState {
  return {
    name: shop?.name ?? '',
    slug: shop?.slug ?? '',
    type: shop?.type ?? 'FOOD',
    locationId: shop?.locationId ?? '',
    description: shop?.description ?? '',
    address: shop?.address ?? '',
    mapUrl: shop?.mapUrl ?? '',
    phone: shop?.phone ?? '',
    whatsapp: shop?.whatsapp ?? '',
    instagramUrl: shop?.instagramUrl ?? '',
    features: shop?.features ?? [],
    seoTitle: shop?.seoTitle ?? '',
    seoDescription: shop?.seoDescription ?? '',
    isActive: shop?.isActive ?? true,
    sortOrder: String(shop?.sortOrder ?? 0),
  }
}

const f = tr.admin.shops.fields

export function ShopForm({ mode, shop, locations, isOwner }: ShopFormProps) {
  const router = useRouter()
  const [state, setState] = useState<FormState>(() => initialState(shop))
  const [slugTouched, setSlugTouched] = useState(mode === 'edit')

  const create = useAction(createShopAction, {
    successMessage: tr.admin.shops.created,
    onSuccess: (created) => router.push(ROUTES.admin.shop(created.id)),
  })
  const update = useAction((input: unknown) => updateShopAction(shop?.id ?? '', input), {
    successMessage: tr.admin.shops.saved,
    onSuccess: () => router.refresh(),
  })
  const action = mode === 'create' ? create : update

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((prev) => ({ ...prev, [key]: value }))
  }

  function onNameChange(name: string) {
    set('name', name)
    if (!slugTouched) set('slug', slugify(name))
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const common = {
      name: state.name,
      description: state.description,
      address: state.address,
      mapUrl: state.mapUrl,
      phone: state.phone,
      whatsapp: state.whatsapp,
      instagramUrl: state.instagramUrl,
      features: state.features,
      seoTitle: state.seoTitle,
      seoDescription: state.seoDescription,
    }
    const payload = isOwner
      ? {
          ...common,
          slug: state.slug,
          type: state.type,
          locationId: state.locationId || null,
          isActive: state.isActive,
          sortOrder: Number(state.sortOrder),
        }
      : common
    void action.run(payload)
  }

  const err = (key: string) => firstError(action.fieldErrors, key)

  return (
    <form onSubmit={onSubmit} className="space-y-8" noValidate>
      <FormError error={action.error} />

      <section className="grid gap-5 sm:grid-cols-2">
        <Field label={f.name} htmlFor="name" error={err('name')} className="sm:col-span-2">
          <Input
            id="name"
            value={state.name}
            onChange={(e) => onNameChange(e.target.value)}
            className="h-10"
            required
          />
        </Field>

        {isOwner ? (
          <>
            <Field
              label={f.slug}
              htmlFor="slug"
              error={err('slug')}
              hint={`${tr.common.brand.toLowerCase()}.com/${state.slug || '…'}`}
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
                autoCorrect="off"
              />
            </Field>
            <Field label={f.type} htmlFor="type" error={err('type')}>
              <NativeSelect
                id="type"
                value={state.type}
                onChange={(e) => set('type', e.target.value)}
              >
                {SHOP_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label={f.location} htmlFor="locationId" error={err('locationId')}>
              <NativeSelect
                id="locationId"
                value={state.locationId}
                onChange={(e) => set('locationId', e.target.value)}
              >
                <option value="">{f.noLocation}</option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.kind === 'VENUE' ? tr.location.venue : tr.location.district})
                  </option>
                ))}
              </NativeSelect>
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
          </>
        ) : null}

        <Field
          label={f.description}
          htmlFor="description"
          error={err('description')}
          optional
          className="sm:col-span-2"
        >
          <Textarea
            id="description"
            rows={5}
            value={state.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </Field>

        <Field
          label={f.features}
          htmlFor="features"
          error={err('features')}
          hint={f.featuresHint}
          optional
          className="sm:col-span-2"
        >
          <FeaturesInput
            id="features"
            value={state.features}
            onChange={(v) => set('features', v)}
          />
        </Field>
      </section>

      <section className="grid gap-5 sm:grid-cols-2">
        <h2 className="text-lg font-semibold sm:col-span-2">{tr.shop.contact}</h2>
        <Field label={f.phone} htmlFor="phone" error={err('phone')} optional>
          <Input
            id="phone"
            type="tel"
            inputMode="tel"
            value={state.phone}
            onChange={(e) => set('phone', e.target.value)}
            className="h-10"
            placeholder="05xx xxx xx xx"
          />
        </Field>
        <Field
          label={f.whatsapp}
          htmlFor="whatsapp"
          error={err('whatsapp')}
          hint={shop?.location?.kind === 'VENUE' ? f.whatsappHint : undefined}
          optional
        >
          <Input
            id="whatsapp"
            type="tel"
            inputMode="tel"
            value={state.whatsapp}
            onChange={(e) => set('whatsapp', e.target.value)}
            className="h-10"
            placeholder="05xx xxx xx xx"
          />
        </Field>
        <Field
          label={f.address}
          htmlFor="address"
          error={err('address')}
          hint={shop?.location?.kind === 'VENUE' ? f.addressHint : undefined}
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
            inputMode="url"
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
            inputMode="url"
            value={state.instagramUrl}
            onChange={(e) => set('instagramUrl', e.target.value)}
            className="h-10"
            placeholder="https://instagram.com/…"
          />
        </Field>
      </section>

      <section className="grid gap-5 sm:grid-cols-2">
        <h2 className="text-lg font-semibold sm:col-span-2">SEO</h2>
        <Field label={f.seoTitle} htmlFor="seoTitle" error={err('seoTitle')} optional>
          <Input
            id="seoTitle"
            maxLength={70}
            value={state.seoTitle}
            onChange={(e) => set('seoTitle', e.target.value)}
            className="h-10"
          />
        </Field>
        <Field
          label={f.seoDescription}
          htmlFor="seoDescription"
          error={err('seoDescription')}
          optional
        >
          <Input
            id="seoDescription"
            maxLength={160}
            value={state.seoDescription}
            onChange={(e) => set('seoDescription', e.target.value)}
            className="h-10"
          />
        </Field>
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-6">
        {isOwner ? (
          <label className="flex items-center gap-3 text-sm font-medium">
            <Switch
              checked={state.isActive}
              onCheckedChange={(checked) => set('isActive', checked)}
            />
            {f.isActive}
          </label>
        ) : (
          <span />
        )}
        <SubmitButton pending={action.pending} />
      </div>
    </form>
  )
}
