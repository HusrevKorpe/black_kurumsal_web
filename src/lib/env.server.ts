import { z } from 'zod'

/**
 * Yalnızca sunucuda okunur. Bu modül asla bir Client Component'ten import edilmez.
 * (`server-only` kullanılmaz çünkü seed ve entegrasyon testleri Next dışında çalışır.)
 */
const serverSchema = z.object({
  DATABASE_URL: z.url(),
  SUPABASE_SECRET_KEY: z.string().min(1),
  SUPABASE_STORAGE_BUCKET: z.string().min(1).default('media'),
  /** Vercel Cron isteklerinin taşıdığı gizli anahtar. Boşsa cron uçları hiçbir isteği kabul etmez. */
  CRON_SECRET: z.string().trim().optional(),
  /** Ziyaretçi hash'inin tuzu. Tanımsızsa SUPABASE_SECRET_KEY kullanılır (o da yalnızca sunucuda). */
  ANALYTICS_SALT: z.string().trim().min(8).optional(),
})

export const serverEnv = serverSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  SUPABASE_STORAGE_BUCKET: process.env.SUPABASE_STORAGE_BUCKET,
  CRON_SECRET: process.env.CRON_SECRET,
  ANALYTICS_SALT: process.env.ANALYTICS_SALT,
})
