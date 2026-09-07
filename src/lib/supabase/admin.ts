import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { publicEnv } from '@/lib/env'
import { serverEnv } from '@/lib/env.server'

/**
 * Servis anahtarıyla çalışan istemci. RLS'i atlar, tüm yetkilere sahiptir.
 * YALNIZCA sunucuda: kullanıcı oluşturma/silme, imzalı yükleme URL'i, dosya silme.
 */
export function createSupabaseAdminClient(): SupabaseClient {
  return createClient(publicEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SECRET_KEY, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  })
}
