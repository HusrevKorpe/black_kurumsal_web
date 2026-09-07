'use client'

import { useState, type FormEvent } from 'react'
import { Field, FormError, SubmitButton } from '@/components/admin/form'
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
import { createCategoryAction, updateCategoryAction } from '@/features/pricing/actions'
import type { PriceCategoryView } from '@/features/pricing/view'
import { firstError, useAction } from '@/lib/actions/use-action'
import { tr } from '@/lib/i18n/tr'

interface CategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  shopId: string
  category: PriceCategoryView | null
  onSaved: () => void
}

export function CategoryDialog({
  open,
  onOpenChange,
  shopId,
  category,
  onSaved,
}: CategoryDialogProps) {
  const [name, setName] = useState(category?.name ?? '')
  const [description, setDescription] = useState(category?.description ?? '')
  const [isActive, setIsActive] = useState(category?.isActive ?? true)
  const p = tr.admin.pricing

  const action = useAction(
    (input: unknown) =>
      category ? updateCategoryAction(category.id, input) : createCategoryAction(input),
    {
      successMessage: p.saved,
      onSuccess: () => {
        onOpenChange(false)
        onSaved()
      },
    },
  )

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void action.run({ shopId, name, description, isActive })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? p.editCategory : p.addCategory}</DialogTitle>
          <DialogDescription className="sr-only">{p.title}</DialogDescription>
        </DialogHeader>
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormError error={action.error} />
          <Field
            label={p.category.name}
            htmlFor="cat-name"
            error={firstError(action.fieldErrors, 'name')}
          >
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-10"
              autoFocus
              required
            />
          </Field>
          <Field
            label={p.category.description}
            htmlFor="cat-desc"
            error={firstError(action.fieldErrors, 'description')}
            optional
          >
            <Textarea
              id="cat-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <label className="flex items-center gap-3 text-sm font-medium">
            <Switch checked={isActive} onCheckedChange={setIsActive} /> {p.category.isActive}
          </label>
          <div className="flex justify-end pt-2">
            <SubmitButton pending={action.pending} />
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
