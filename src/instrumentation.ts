import * as Sentry from '@sentry/nextjs'
import { publicEnv } from '@/lib/env'
import { buildSentryOptions } from '@/lib/sentry/options'

/** Node ve Edge çalışma ortamlarında sunucu başlarken bir kez çalışır. */
export function register(): void {
  Sentry.init(
    buildSentryOptions({
      dsn: publicEnv.NEXT_PUBLIC_SENTRY_DSN,
      environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
      release: process.env.VERCEL_GIT_COMMIT_SHA,
    }),
  )
}

/** Sunucuda yakalanan her hata (render, route handler, server action, proxy) Sentry'ye gider. */
export const onRequestError = Sentry.captureRequestError
