import { whenIdleAfterLoad } from '@/lib/browser/idle'
import { loadSentry } from './client'

/** Tampon sınırı: hatalı bir döngü sayfayı belleğe boğmasın. */
const MAX_BUFFERED = 20

const buffered: unknown[] = []

function remember(value: unknown): void {
  if (buffered.length < MAX_BUFFERED) buffered.push(value)
}

function onError(event: ErrorEvent): void {
  remember(event.error ?? event.message)
}

function onRejection(event: PromiseRejectionEvent): void {
  remember(event.reason)
}

/**
 * Sentry'yi hydration'dan önce değil, sayfa yüklenip boşa çıktıktan sonra başlatır. O ana kadar
 * yakalanmamış hatalar ve reddedilen sözler tamponlanır, SDK açılınca aynı sırayla iletilir.
 * Dinleyiciler SDK kendi genel yakalayıcılarını kurmadan hemen önce kaldırılır; çift bildirim olmaz.
 */
export function initSentryLazily(): void {
  window.addEventListener('error', onError)
  window.addEventListener('unhandledrejection', onRejection)
  whenIdleAfterLoad(() => {
    void loadSentry().then((Sentry) => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
      if (!Sentry) return
      for (const error of buffered.splice(0)) Sentry.captureException(error)
    })
  })
}
