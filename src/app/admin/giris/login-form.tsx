'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { tr } from '@/lib/i18n/tr'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'

interface LoginFormProps {
  next: string
  reason: string | null
}

const REASON_MESSAGES: Record<string, string> = {
  unauthorized: tr.admin.login.unauthorized,
  signed_out: tr.admin.login.signedOut,
}

export function LoginForm({ next, reason }: LoginFormProps) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(
    reason ? (REASON_MESSAGES[reason] ?? null) : null,
  )
  const [pending, setPending] = useState(false)

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)
    const supabase = createSupabaseBrowserClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })
    if (signInError) {
      // Yanlış şifre ile sunucu/ağ hatasını ayır: kullanıcı doğru mesajı görsün.
      const isCredentialError =
        signInError.code === 'invalid_credentials' || signInError.status === 400
      setError(isCredentialError ? tr.admin.login.invalid : tr.errors.unexpected)
      setPending(false)
      return
    }
    router.replace(next as Parameters<typeof router.replace>[0])
    router.refresh()
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      <div className="space-y-2">
        <Label htmlFor="email">{tr.admin.login.email}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="h-11"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{tr.admin.login.password}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="h-11"
        />
      </div>
      <Button type="submit" size="lg" className="w-full" disabled={pending || !email || !password}>
        {pending ? tr.admin.login.pending : tr.admin.login.submit}
      </Button>
    </form>
  )
}
