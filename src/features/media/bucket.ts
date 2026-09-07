import type { SupabaseClient } from '@supabase/supabase-js'
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from './paths'

/**
 * Medya bucket'ının canlıda beklenen ayarları. Yerelde aynı değerler `supabase/config.toml`
 * `[storage.buckets.media]` altında (config push bucket'ı canlıda oluşturmuyor; `pnpm storage:init`).
 */
export const MEDIA_BUCKET_OPTIONS = {
  public: true,
  fileSizeLimit: MAX_UPLOAD_BYTES,
  allowedMimeTypes: [...ALLOWED_IMAGE_TYPES],
}

export type EnsureBucketResult = { created: boolean }

/** Bucket yoksa oluşturur, varsa ayarlarını beklenen değerlere çeker. İdempotent. */
export async function ensureMediaBucket(
  supabase: SupabaseClient,
  name: string,
): Promise<EnsureBucketResult> {
  const existing = await supabase.storage.getBucket(name)
  if (existing.error && !/not found/i.test(existing.error.message)) {
    throw new Error(`Bucket okunamadı (${name}): ${existing.error.message}`)
  }
  if (existing.data) {
    const updated = await supabase.storage.updateBucket(name, MEDIA_BUCKET_OPTIONS)
    if (updated.error) throw new Error(`Bucket güncellenemedi (${name}): ${updated.error.message}`)
    return { created: false }
  }
  const created = await supabase.storage.createBucket(name, MEDIA_BUCKET_OPTIONS)
  if (created.error) throw new Error(`Bucket oluşturulamadı (${name}): ${created.error.message}`)
  return { created: true }
}
