'use client'

import { WandSparklesIcon } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Field, FormError } from '@/components/admin/form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { resetStaffPasswordAction } from '@/features/staff/actions'
import { firstError, useAction } from '@/lib/actions/use-action'
import { generatePassword, PASSWORD_MIN_LENGTH } from '@/lib/auth/generate-password'
import { tr } from '@/lib/i18n/tr'

export function ResetPasswordForm({ userId }: { userId: string }) {
  const [password, setPassword] = useState('')
  const action = useAction(resetStaffPasswordAction, {
    successMessage: tr.admin.users.passwordReset,
    onSuccess: () => setPassword(''),
  })
  const u = tr.admin.users

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void action.run({ id: userId, password })
  }

  return (
    <section className="rounded-xl border p-4">
      <h2 className="font-semibold">{u.resetPasswordTitle}</h2>
      <form
        onSubmit={onSubmit}
        className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end"
        noValidate
      >
        <Field
          label={u.newPassword}
          htmlFor="new-password"
          error={firstError(action.fieldErrors, 'password')}
          hint={u.fields.passwordHint}
          className="flex-1"
        >
          <div className="flex gap-2">
            <Input
              id="new-password"
              type="text"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 flex-1 font-mono"
              minLength={PASSWORD_MIN_LENGTH}
            />
            <Button
              type="button"
              variant="outline"
              className="h-10"
              onClick={() => setPassword(generatePassword())}
            >
              <WandSparklesIcon data-icon="inline-start" /> {u.generatePassword}
            </Button>
          </div>
        </Field>
        <Button
          type="submit"
          disabled={action.pending || password.length < PASSWORD_MIN_LENGTH}
          className="h-10"
        >
          {u.resetPassword}
        </Button>
      </form>
      <FormError error={action.error} />
    </section>
  )
}
