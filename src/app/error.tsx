'use client'

import { useEffect } from 'react'
import { captureException } from '@/lib/sentry/client'
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
    void captureException(error)
  }, [error])

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-4 py-24 text-center sm:px-6">
      <h1 className="text-3xl font-bold tracking-tight">{tr.common.errorTitle}</h1>
      <p className="mt-3 max-w-md text-muted-foreground">{tr.common.errorText}</p>
      {error.digest ? (
        <p className="mt-2 font-mono text-xs text-muted-foreground">{error.digest}</p>
      ) : null}
      {/* Düz düğme: hata sınırı her sayfanın paketine girer, bileşen kütüphanesini taşımasın. */}
      <button
        type="button"
        onClick={retry}
        className="mt-8 inline-flex h-12 items-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        {tr.common.retry}
      </button>
    </main>
  )
}
