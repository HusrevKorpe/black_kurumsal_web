import { createBrowserClient } from '@supabase/ssr'
import { publicEnv } from '@/lib/env'

/** Tarayıcıda yalnızca giriş/çıkış ve imzalı URL'e dosya yükleme için kullanılır. */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  )
}
