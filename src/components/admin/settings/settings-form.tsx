'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Field, FormError, SubmitButton } from '@/components/admin/form'
import { ImageUploadButton } from '@/components/admin/image-upload-button'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { updateSiteSettingsAction } from '@/features/settings/actions'
import type { SiteSettings } from '@/generated/prisma/client'
import { firstError, useAction } from '@/lib/actions/use-action'
import { tr } from '@/lib/i18n/tr'

interface SettingsFormProps {
  settings: SiteSettings
  logo: { id: string; url: string } | null
}

const f = tr.admin.settings.fields

export function SettingsForm({ settings, logo: initialLogo }: SettingsFormProps) {
  const router = useRouter()
  const [state, setState] = useState({
    brandName: settings.brandName,
    heroTitle: settings.heroTitle,
    heroSubtitle: settings.heroSubtitle ?? '',
    aboutText: settings.aboutText ?? '',
    contactPhone: settings.contactPhone ?? '',
    contactEmail: settings.contactEmail ?? '',
    instagramUrl: settings.instagramUrl ?? '',
    facebookUrl: settings.facebookUrl ?? '',
  })
  const [logo, setLogo] = useState(initialLogo)
  const action = useAction(updateSiteSettingsAction, {
    successMessage: tr.admin.settings.saved,
    onSuccess: () => router.refresh(),
  })
  const err = (key: string) => firstError(action.fieldErrors, key)

  function set<K extends keyof typeof state>(key: K, value: string) {
    setState((prev) => ({ ...prev, [key]: value }))
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void action.run({ ...state, logoImageId: logo?.id ?? null })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8" noValidate>
      <FormError error={action.error} />
      <section className="grid gap-5 sm:grid-cols-2">
        <Field label={f.brandName} htmlFor="brandName" error={err('brandName')}>
          <Input
            id="brandName"
            value={state.brandName}
            onChange={(e) => set('brandName', e.target.value)}
            className="h-10"
            maxLength={40}
          />
        </Field>
        <div className="space-y-2">
          <p className="text-sm font-medium">{f.logo}</p>
          <div className="flex items-center gap-3">
            {logo ? (
              <div className="relative size-14 overflow-hidden rounded-md bg-muted">
                <Image src={logo.url} alt="" fill sizes="56px" className="object-contain" />
              </div>
            ) : null}
            <ImageUploadButton
              owner={{ kind: 'settings', id: 'site' }}
              variant="outline"
              size="sm"
              label={f.logo}
              onUploaded={([m]) => m && setLogo({ id: m.mediaId, url: m.url })}
            />
            {logo ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => setLogo(null)}>
                {f.removeLogo}
              </Button>
            ) : null}
          </div>
        </div>
        <Field
          label={f.heroTitle}
          htmlFor="heroTitle"
          error={err('heroTitle')}
          className="sm:col-span-2"
        >
          <Input
            id="heroTitle"
            value={state.heroTitle}
            onChange={(e) => set('heroTitle', e.target.value)}
            className="h-10"
            maxLength={120}
          />
        </Field>
        <Field
          label={f.heroSubtitle}
          htmlFor="heroSubtitle"
          error={err('heroSubtitle')}
          optional
          className="sm:col-span-2"
        >
          <Textarea
            id="heroSubtitle"
            rows={2}
            value={state.heroSubtitle}
            onChange={(e) => set('heroSubtitle', e.target.value)}
            maxLength={300}
          />
        </Field>
        <Field
          label={f.aboutText}
          htmlFor="aboutText"
          error={err('aboutText')}
          optional
          className="sm:col-span-2"
        >
          <Textarea
            id="aboutText"
            rows={5}
            value={state.aboutText}
            onChange={(e) => set('aboutText', e.target.value)}
            maxLength={3000}
          />
        </Field>
      </section>
      <section className="grid gap-5 sm:grid-cols-2">
        <h2 className="text-lg font-semibold sm:col-span-2">{tr.footer.contact}</h2>
        <Field label={f.contactPhone} htmlFor="contactPhone" error={err('contactPhone')} optional>
          <Input
            id="contactPhone"
            type="tel"
            value={state.contactPhone}
            onChange={(e) => set('contactPhone', e.target.value)}
            className="h-10"
            placeholder="05xx xxx xx xx"
          />
        </Field>
        <Field label={f.contactEmail} htmlFor="contactEmail" error={err('contactEmail')} optional>
          <Input
            id="contactEmail"
            type="email"
            value={state.contactEmail}
            onChange={(e) => set('contactEmail', e.target.value)}
            className="h-10"
          />
        </Field>
        <Field label={f.instagramUrl} htmlFor="instagramUrl" error={err('instagramUrl')} optional>
          <Input
            id="instagramUrl"
            type="url"
            value={state.instagramUrl}
            onChange={(e) => set('instagramUrl', e.target.value)}
            className="h-10"
            placeholder="https://instagram.com/…"
          />
        </Field>
        <Field label={f.facebookUrl} htmlFor="facebookUrl" error={err('facebookUrl')} optional>
          <Input
            id="facebookUrl"
            type="url"
            value={state.facebookUrl}
            onChange={(e) => set('facebookUrl', e.target.value)}
            className="h-10"
            placeholder="https://facebook.com/…"
          />
        </Field>
      </section>
      <div className="flex justify-end border-t pt-6">
        <SubmitButton pending={action.pending} />
      </div>
    </form>
  )
}
