import { publicEnv } from '@/lib/env'

export interface MediaRef {
  bucket: string
  path: string
}

/** Supabase Storage'daki public dosyanın tam URL'i. Sunucu ve tarayıcıda aynı çalışır. */
export function mediaPublicUrl(media: MediaRef): string {
  const base = publicEnv.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, '')
  const path = media.path.split('/').map(encodeURIComponent).join('/')
  return `${base}/storage/v1/object/public/${media.bucket}/${path}`
}
