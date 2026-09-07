import 'server-only'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { publicEnv } from '@/lib/env'

/** Server Component, Server Action ve Route Handler içinde oturum okumak için. */
export async function createSupabaseServerClient() {
  const cookieStore = await cookies()

  return createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Server Component içinden çağrıldı: çerez yazılamaz.
            // Oturum yenilemesini proxy.ts üstlenir; burada sessiz kalmak doğru davranıştır.
          }
        },
      },
    },
  )
}
