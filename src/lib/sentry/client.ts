import { buildSentryOptions } from './options'
import type * as SentrySdkModule from './sdk'

type SentrySdk = typeof SentrySdkModule

// NEXT_PUBLIC_* değerleri build'de satır içine gömülür; `@/lib/env` (Zod) bilinçli olarak
// import edilmez, bu modül açık sitenin her sayfasına girer.
const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN

/** DSN yoksa (yerel geliştirme, test, CI) tarayıcıya hiçbir Sentry kodu indirilmez. */
export const SENTRY_ENABLED = Boolean(DSN?.trim())

let sdk: Promise<SentrySdk | null> | undefined

/**
 * Tarayıcı SDK'sını ilk çağrıda ayrı bir chunk olarak indirir ve başlatır; sonraki çağrılar
 * aynı sözü paylaşır. SDK açık sitenin ilk paketine girmez: ~70 KB gz JS ve başlangıç maliyeti
 * LCP görselinin boyanmasını geciktirmesin (plan §12). İndirme başarısız olursa null döner ve
 * bir sonraki çağrı yeniden dener.
 */
export function loadSentry(): Promise<SentrySdk | null> {
  if (!SENTRY_ENABLED) return Promise.resolve(null)
  sdk ??= import('./sdk')
    .then((Sentry) => {
      Sentry.init(
        buildSentryOptions({
          dsn: DSN,
          environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
          release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
        }),
      )
      return Sentry
    })
    .catch(() => {
      sdk = undefined
      return null
    })
  return sdk
}

/** Hata sınırlarından çağrılır: SDK yüklü değilse önce yükler, sonra hatayı bildirir. */
export function captureException(error: unknown): Promise<void> {
  return loadSentry().then((Sentry) => {
    Sentry?.captureException(error)
  })
}
