'use client'

import { XIcon } from 'lucide-react'
import Image from 'next/image'
import { useState, type FormEvent } from 'react'
import { Field, FormError, SubmitButton } from '@/components/admin/form'
import { ImageUploadButton } from '@/components/admin/image-upload-button'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { createItemAction, updateItemAction } from '@/features/pricing/actions'
import type { PriceItemView } from '@/features/pricing/view'
import { firstError, useAction } from '@/lib/actions/use-action'
import { tr } from '@/lib/i18n/tr'
import { mediaPublicUrl } from '@/lib/media/url'

interface ItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shopId: string
  categoryId: string
  item: PriceItemView | null
  defaultUnit: string | null
  onSaved: () => void
}

interface ImageState {
  id: string
  url: string
}

export function ItemDialog({
  open,
  onOpenChange,
  shopId,
  categoryId,
  item,
  defaultUnit,
  onSaved,
}: ItemDialogProps) {
  const p = tr.admin.pricing.item
  const [name, setName] = useState(item?.name ?? '')
  const [description, setDescription] = useState(item?.description ?? '')
  const [price, setPrice] = useState(item?.price ?? '')
  const [unit, setUnit] = useState(item?.unit ?? defaultUnit ?? '')
  const [isFeatured, setIsFeatured] = useState(item?.isFeatured ?? false)
  const [isAvailable, setIsAvailable] = useState(item?.isAvailable ?? true)
  const [image, setImage] = useState<ImageState | null>(
    item?.image ? { id: '', url: mediaPublicUrl(item.image) } : null,
  )
  const [imageChanged, setImageChanged] = useState(false)

  const action = useAction(
    (input: unknown) => (item ? updateItemAction(item.id, input) : createItemAction(input)),
    {
      successMessage: tr.admin.pricing.saved,
      onSuccess: () => {
        onOpenChange(false)
        onSaved()
      },
    },
  )

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payload: Record<string, unknown> = {
      categoryId,
      name,
      description,
      price,
      unit,
      isFeatured,
      isAvailable,
    }
    // imageId: değişmediyse gönderilmez (undefined) → sunucu dokunmaz. Kaldırıldıysa null.
    if (imageChanged) payload.imageId = image ? image.id : null
    void action.run(payload)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{item ? tr.admin.pricing.editItem : tr.admin.pricing.addItem}</DialogTitle>
          <DialogDescription className="sr-only">{tr.admin.pricing.title}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormError error={action.error} />
          <Field label={p.name} htmlFor="item-name" error={firstError(action.fieldErrors, 'name')}>
            <Input
              id="item-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10"
              autoFocus
              required
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field
              label={p.price}
              htmlFor="item-price"
              error={firstError(action.fieldErrors, 'price')}
              hint={p.priceHint}
            >
              <Input
                id="item-price"
                inputMode="decimal"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="h-10"
                placeholder="120"
              />
            </Field>
            <Field
              label={p.unit}
              htmlFor="item-unit"
              error={firstError(action.fieldErrors, 'unit')}
              optional
            >
              <Input
                id="item-unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="h-10"
                placeholder={p.unitPlaceholder}
                maxLength={20}
              />
            </Field>
          </div>
          <Field
            label={p.description}
            htmlFor="item-desc"
            error={firstError(action.fieldErrors, 'description')}
            optional
          >
            <Textarea
              id="item-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>

          <div className="space-y-2">
            <p className="text-sm font-medium">{p.image}</p>
            <div className="flex items-center gap-3">
              {image ? (
                <div className="relative size-16 overflow-hidden rounded-md">
                  <Image src={image.url} alt="" fill sizes="64px" className="object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setImage(null)
                      setImageChanged(true)
                    }}
                    className="absolute top-0.5 right-0.5 rounded-full bg-background/90 p-0.5"
                    aria-label={p.removeImage}
                  >
                    <XIcon className="size-3" />
                  </button>
                </div>
              ) : null}
              <ImageUploadButton
                owner={{ kind: 'price-item', id: shopId }}
                variant="outline"
                size="sm"
                label={p.image}
                alt={name || null}
                onUploaded={([media]) => {
                  if (!media) return
                  setImage({ id: media.mediaId, url: media.url })
                  setImageChanged(true)
                }}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:gap-6">
            <label className="flex items-center gap-3 text-sm font-medium">
              <Switch checked={isFeatured} onCheckedChange={setIsFeatured} /> {p.isFeatured}
            </label>
            <label className="flex items-center gap-3 text-sm font-medium">
              <Switch checked={isAvailable} onCheckedChange={setIsAvailable} /> {p.isAvailable}
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {tr.common.cancel}
            </Button>
            <SubmitButton pending={action.pending} />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
