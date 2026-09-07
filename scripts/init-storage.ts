import 'dotenv/config'
import { ensureMediaBucket } from '@/features/media/bucket'
import { serverEnv } from '@/lib/env.server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

/**
 * Medya bucket'ını oluşturur ya da ayarlarını doğrular (public, 10 MiB, yalnızca görsel MIME).
 *   pnpm storage:init                                   → yerel
 *   DOTENV_CONFIG_PATH=.env.canli pnpm storage:init     → canlı
 */
async function main(): Promise<void> {
  const name = serverEnv.SUPABASE_STORAGE_BUCKET
  const result = await ensureMediaBucket(createSupabaseAdminClient(), name)
  process.stdout.write(
    `${name}: ${result.created ? 'oluşturuldu' : 'zaten vardı, ayarlar doğrulandı'} (public, 10 MiB, görsel MIME)\n`,
  )
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
