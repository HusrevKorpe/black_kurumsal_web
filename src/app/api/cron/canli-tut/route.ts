import { NextResponse } from 'next/server'
import { isCronRequestAuthorized } from '@/lib/cron-auth'
import { db } from '@/lib/db'
import { publicEnv } from '@/lib/env'
import { serverEnv } from '@/lib/env.server'

export const dynamic = 'force-dynamic'

/**
 * Günlük canlı tutma (vercel.json → crons): Supabase ücretsiz planı hareketsiz projeyi durduruyor,
 * proje durunca da sitedeki fotoğraflar ve panel gidiyor. Hem veritabanına hem Supabase API'sine
 * gerçek bir istek atar; biri başarısız olursa Vercel kayıtlarında görünsün diye 500 döner.
 * Vercel, CRON_SECRET tanımlıysa isteğe Bearer başlığını kendisi ekler.
 */
export async function GET(request: Request): Promise<NextResponse> {
  if (!isCronRequestAuthorized(request, serverEnv.CRON_SECRET)) {
    const status = serverEnv.CRON_SECRET ? 401 : 503
    return NextResponse.json({ error: 'Yetkisiz' }, { status })
  }

  try {
    const shops = await db.shop.count()
    const api = await fetch(`${publicEnv.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/health`, {
      headers: { apikey: publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY },
      cache: 'no-store',
    })
    if (!api.ok) throw new Error(`Supabase API ${api.status} döndü`)
    return NextResponse.json({ ok: true, shops })
  } catch (error) {
    console.error('Canlı tutma başarısız', error)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
