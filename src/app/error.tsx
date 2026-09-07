'use client'

import * as Sentry from '@sentry/nextjs'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { tr } from '@/lib/i18n/tr'

/** Sayfa düzeyinde hata sınırı: kök layout ayakta kalır, içerik yerine bu görünür. */
export default function RouteError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-4 py-24 text-center sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">{tr.common.errorTitle}</h1>
      <p className="mt-3 max-w-md text-muted-foreground">{tr.common.errorText}</p>
      {error.digest ? (
        <p className="mt-2 font-mono text-xs text-muted-foreground">{error.digest}</p>
      ) : null}
      <Button size="lg" className="mt-8" onClick={retry}>
        {tr.common.retry}
      </Button>
    </main>
  )
}
