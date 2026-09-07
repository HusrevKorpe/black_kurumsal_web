'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Field, FormError, NativeSelect, SubmitButton } from '@/components/admin/form'
import { ImageUploadButton } from '@/components/admin/image-upload-button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { createCampaignAction, updateCampaignAction } from '@/features/campaigns/actions'
import type { CampaignTargets } from '@/features/campaigns/admin-queries'
import type { CampaignCardData } from '@/features/campaigns/queries'
import { firstError, useAction } from '@/lib/actions/use-action'
import { ROUTES } from '@/lib/constants/routes'
import { tr } from '@/lib/i18n/tr'
import { mediaPublicUrl } from '@/lib/media/url'
import { dateToLocalInput, localInputToIso } from '@/lib/utils/datetime'

interface CampaignFormProps {
  mode: 'create' | 'edit'
  campaign?: CampaignCardData
  targets: CampaignTargets
  staff: { id: string; isOwner: boolean }
}

const f = tr.admin.campaigns.fields

export function CampaignForm({ mode, campaign, targets, staff }: CampaignFormProps) {
  const router = useRouter()
  const [state, setState] = useState({
    title: campaign?.title ?? '',
    description: campaign?.description ?? '',
    scope: campaign?.scope ?? (staff.isOwner ? 'GLOBAL' : 'SHOP'),
    shopId: campaign?.shopId ?? targets.shops[0]?.id ?? '',
    locationId: campaign?.locationId ?? targets.locations[0]?.id ?? '',
    ctaLabel: campaign?.ctaLabel ?? '',
    ctaUrl: campaign?.ctaUrl ?? '',
    startsAt: dateToLocalInput(campaign?.startsAt),
    endsAt: dateToLocalInput(campaign?.endsAt),
    isActive: campaign?.isActive ?? true,
    sortOrder: String(campaign?.sortOrder ?? 0),
  })
  const [image, setImage] = useState<{ id: string; url: string } | null>(
    campaign ? { id: campaign.imageId, url: mediaPublicUrl(campaign.image) } : null,
  )

  const create = useAction(createCampaignAction, {
    successMessage: tr.admin.campaigns.created,
    onSuccess: () => router.push(ROUTES.admin.campaigns),
  })
  const update = useAction((input: unknown) => updateCampaignAction(campaign?.id ?? '', input), {
    successMessage: tr.admin.campaigns.saved,
    onSuccess: () => router.refresh(),
  })
  const action = mode === 'create' ? create : update
  const err = (key: string) => firstError(action.fieldErrors, key)

  function set<K extends keyof typeof state>(key: K, value: (typeof state)[K]) {
    setState((prev) => ({ ...prev, [key]: value }))
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void action.run({
      title: state.title,
      description: state.description,
      imageId: image?.id ?? '',
      scope: state.scope,
      shopId: state.scope === 'SHOP' ? state.shopId || null : null,
      locationId: state.scope === 'LOCATION' ? state.locationId || null : null,
      ctaLabel: state.ctaLabel,
      ctaUrl: state.ctaUrl,
      startsAt: localInputToIso(state.startsAt) ?? '',
      endsAt: localInputToIso(state.endsAt) ?? '',
      isActive: state.isActive,
      sortOrder: Number(state.sortOrder),
    })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8" noValidate>
      <FormError error={action.error} />

      <section className="space-y-5">
        <Field label={f.title} htmlFor="title" error={err('title')}>
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
            rows={3}
            value={state.description}
            onChange={(e) => set('description', e.target.value)}
            maxLength={500}
          />
        </Field>

        <div className="space-y-2">
          <p className="text-sm font-medium">{f.image}</p>
          {image ? (
            <div className="relative aspect-video w-full max-w-md overflow-hidden rounded-lg border">
              <Image src={image.url} alt="" fill sizes="448px" className="object-cover" />
            </div>
          ) : null}
          <ImageUploadButton
            owner={{ kind: 'campaign', id: staff.id }}
            variant={image ? 'outline' : 'default'}
            label={image ? tr.common.edit : f.image}
            alt={state.title || null}
            onUploaded={([media]) => media && setImage({ id: media.mediaId, url: media.url })}
          />
          {err('imageId') ? (
            <p role="alert" className="text-xs text-destructive">
              {tr.admin.campaigns.imageRequired}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">{f.imageHint}</p>
          )}
        </div>
      </section>

      <section className="grid gap-5 sm:grid-cols-2">
        <Field label={f.scope} htmlFor="scope" error={err('scope')}>
          <NativeSelect
            id="scope"
            value={state.scope}
            onChange={(e) => set('scope', e.target.value as typeof state.scope)}
            disabled={!staff.isOwner}
          >
            {staff.isOwner ? <option value="GLOBAL">{f.scopeGlobal}</option> : null}
            {staff.isOwner ? <option value="LOCATION">{f.scopeLocation}</option> : null}
            <option value="SHOP">{f.scopeShop}</option>
          </NativeSelect>
        </Field>
        {state.scope === 'SHOP' ? (
          <Field label={f.target} htmlFor="shopId" error={err('shopId')}>
            <NativeSelect
              id="shopId"
              value={state.shopId}
              onChange={(e) => set('shopId', e.target.value)}
            >
              {targets.shops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
        ) : null}
        {state.scope === 'LOCATION' ? (
          <Field label={f.target} htmlFor="locationId" error={err('locationId')}>
            <NativeSelect
              id="locationId"
              value={state.locationId}
              onChange={(e) => set('locationId', e.target.value)}
            >
              {targets.locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
        ) : null}
      </section>

      <section className="grid gap-5 sm:grid-cols-2">
        <Field
          label={f.startsAt}
          htmlFor="startsAt"
          error={err('startsAt')}
          optional
          hint={f.datesHint}
        >
          <Input
            id="startsAt"
            type="datetime-local"
            value={state.startsAt}
            onChange={(e) => set('startsAt', e.target.value)}
            className="h-10"
          />
        </Field>
        <Field label={f.endsAt} htmlFor="endsAt" error={err('endsAt')} optional>
          <Input
            id="endsAt"
            type="datetime-local"
            value={state.endsAt}
            onChange={(e) => set('endsAt', e.target.value)}
            className="h-10"
          />
        </Field>
        <Field label={f.ctaLabel} htmlFor="ctaLabel" error={err('ctaLabel')} optional>
          <Input
            id="ctaLabel"
            value={state.ctaLabel}
            onChange={(e) => set('ctaLabel', e.target.value)}
            className="h-10"
            maxLength={40}
          />
        </Field>
        <Field label={f.ctaUrl} htmlFor="ctaUrl" error={err('ctaUrl')} optional>
          <Input
            id="ctaUrl"
            type="url"
            value={state.ctaUrl}
            onChange={(e) => set('ctaUrl', e.target.value)}
            className="h-10"
            placeholder="https://…"
          />
        </Field>
        {staff.isOwner ? (
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
        ) : null}
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
