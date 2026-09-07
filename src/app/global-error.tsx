'use client'

import { useEffect } from 'react'
import { captureException } from '@/lib/sentry/client'
import { tr } from '@/lib/i18n/tr'
import './globals.css'

/**
 * Kök layout'un kendisi çökerse devreye girer; layout artık olmadığı için kendi
 * <html>/<body>'sini kurar. Bileşen kütüphanesi bilinçli olarak kullanılmaz:
 * en az bağımlılıkla ayakta kalmalı.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    void captureException(error)
  }, [error])

  return (
    <html lang="tr" className="dark h-full antialiased">
      <body className="flex min-h-full flex-col items-center justify-center bg-background px-4 text-center text-foreground">
        <title>{tr.common.errorTitle}</title>
        <main>
          <h1 className="text-3xl font-bold tracking-tight">{tr.common.errorTitle}</h1>
          <p className="mt-3 max-w-md text-muted-foreground">{tr.common.errorText}</p>
          {error.digest ? (
            <p className="mt-2 font-mono text-xs text-muted-foreground">{error.digest}</p>
          ) : null}
          <button
            type="button"
            onClick={retry}
            className="mt-8 inline-flex h-11 items-center rounded-md bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            {tr.common.retry}
          </button>
        </main>
      </body>
    </html>
  )
}
