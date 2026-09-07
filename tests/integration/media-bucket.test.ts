import { afterAll, describe, expect, it } from 'vitest'
import { ensureMediaBucket, MEDIA_BUCKET_OPTIONS } from '@/features/media/bucket'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

const supabase = createSupabaseAdminClient()
const NAME = `itest-bucket-${Date.now()}`

afterAll(async () => {
  await supabase.storage.deleteBucket(NAME)
})

describe('medya bucket kurulumu', () => {
  it('yoksa oluşturur; varsa bozulmuş ayarları beklenen değerlere çeker', async () => {
    expect(await ensureMediaBucket(supabase, NAME)).toEqual({ created: true })
    const created = await supabase.storage.getBucket(NAME)
    expect(created.data).toMatchObject({
      public: true,
      file_size_limit: MEDIA_BUCKET_OPTIONS.fileSizeLimit,
      allowed_mime_types: MEDIA_BUCKET_OPTIONS.allowedMimeTypes,
    })

    await supabase.storage.updateBucket(NAME, { public: false, fileSizeLimit: 1024 })
    expect(await ensureMediaBucket(supabase, NAME)).toEqual({ created: false })
    const repaired = await supabase.storage.getBucket(NAME)
    expect(repaired.data).toMatchObject({
      public: true,
      file_size_limit: MEDIA_BUCKET_OPTIONS.fileSizeLimit,
    })
  })
})
