'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Field, FormError, NativeSelect, SubmitButton } from '@/components/admin/form'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import type { StaffListItem } from '@/features/staff/admin-queries'
import { createStaffAction, updateStaffAction } from '@/features/staff/actions'
import { firstError, useAction } from '@/lib/actions/use-action'
import { ROUTES } from '@/lib/constants/routes'
import { tr } from '@/lib/i18n/tr'

interface StaffFormProps {
  mode: 'create' | 'edit'
  user?: StaffListItem
  shops: { id: string; name: string }[]
  isSelf?: boolean
}

const f = tr.admin.users.fields

export function StaffForm({ mode, user, shops, isSelf = false }: StaffFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState(user?.email ?? '')
  const [fullName, setFullName] = useState(user?.fullName ?? '')
  const [role, setRole] = useState<'OWNER' | 'MANAGER'>(user?.role ?? 'MANAGER')
  const [password, setPassword] = useState('')
  const [isActive, setIsActive] = useState(user?.isActive ?? true)
  const [shopIds, setShopIds] = useState<string[]>(user?.assignments.map((a) => a.shopId) ?? [])

  const create = useAction(createStaffAction, {
    successMessage: tr.admin.users.created,
    onSuccess: () => router.push(ROUTES.admin.users),
  })
  const update = useAction(updateStaffAction, {
    successMessage: tr.admin.users.saved,
    onSuccess: () => router.refresh(),
  })
  const action = mode === 'create' ? create : update
  const err = (key: string) => firstError(action.fieldErrors, key)

  function toggleShop(id: string, checked: boolean) {
    setShopIds((prev) => (checked ? [...new Set([...prev, id])] : prev.filter((s) => s !== id)))
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (mode === 'create') void action.run({ email, fullName, role, password, shopIds })
    else void action.run({ id: user?.id, fullName, role, isActive, shopIds })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <FormError error={action.error} />
      <Field
        label={f.email}
        htmlFor="email"
        error={err('email')}
        hint={mode === 'create' ? f.emailHint : undefined}
      >
        <Input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="off"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-10"
          disabled={mode === 'edit'}
          required
        />
      </Field>
      <Field label={f.fullName} htmlFor="fullName" error={err('fullName')}>
        <Input
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="h-10"
          required
        />
      </Field>
      <Field
        label={f.role}
        htmlFor="role"
        error={err('role')}
        hint={role === 'OWNER' ? f.roleOwnerHint : f.roleManagerHint}
      >
        <NativeSelect
          id="role"
          value={role}
          onChange={(e) => setRole(e.target.value as 'OWNER' | 'MANAGER')}
          disabled={isSelf}
        >
          <option value="MANAGER">{tr.admin.roles.MANAGER}</option>
          <option value="OWNER">{tr.admin.roles.OWNER}</option>
        </NativeSelect>
      </Field>
      {mode === 'create' ? (
        <Field label={f.password} htmlFor="password" error={err('password')} hint={f.passwordHint}>
          <Input
            id="password"
            type="text"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-10 font-mono"
            required
            minLength={8}
          />
        </Field>
      ) : null}

      {role === 'MANAGER' ? (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{f.shops}</legend>
          <p className="text-xs text-muted-foreground">{f.shopsHint}</p>
          {err('shopIds') ? <p className="text-xs text-destructive">{err('shopIds')}</p> : null}
          <ul className="grid gap-2 rounded-xl border p-3 sm:grid-cols-2">
            {shops.map((shop) => (
              <li key={shop.id}>
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={shopIds.includes(shop.id)}
                    onCheckedChange={(checked) => toggleShop(shop.id, checked === true)}
                  />
                  {shop.name}
                </label>
              </li>
            ))}
          </ul>
        </fieldset>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-6">
        {mode === 'edit' ? (
          <label className="flex items-start gap-3 text-sm font-medium">
            <Switch
              checked={isActive}
              onCheckedChange={setIsActive}
              disabled={isSelf}
              className="mt-0.5"
            />
            <span>
              {f.isActive}
              <span className="block text-xs font-normal text-muted-foreground">
                {isSelf ? tr.admin.users.selfLock : f.isActiveHint}
              </span>
            </span>
          </label>
        ) : (
          <span />
        )}
        <SubmitButton pending={action.pending} />
      </div>
    </form>
  )
}
