import { z } from 'zod'

/**
 * Tarayıcıya açık ortam değişkenleri. Next.js yalnızca `process.env.NEXT_PUBLIC_X`
 * biçimindeki birebir referansları istemci paketine gömer; bu yüzden tek tek yazılır.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SITE_URL: z.url(),
  /** Boşsa hata izleme kapalıdır (yerel geliştirme, test). */
  NEXT_PUBLIC_SENTRY_DSN: z.url().or(z.literal('')).optional(),
})

export const publicEnv = publicSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SENTRY_DSN: process.env.NEXT_PUBLIC_SENTRY_DSN,
})
