import * as Sentry from '@sentry/nextjs'
import { buildSentryOptions } from '@/lib/sentry/options'

// Tarayıcıda hydration'dan önce, her sayfada çalışır; DSN yoksa hiçbir şey göndermez.
// `@/lib/env` (Zod) bilinçli olarak import edilmez: bu dosya açık sitenin her sayfasına
// girer, Zod'u paketlemek ~85 KB gz ekler. NEXT_PUBLIC_* değerleri build'de satır içine gömülür.
Sentry.init(
  buildSentryOptions({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
  }),
)

/** App Router sayfa geçişleri hata kayıtlarına kırıntı olarak eklenir. */
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart
