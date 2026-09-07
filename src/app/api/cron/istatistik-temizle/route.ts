import { NextResponse } from 'next/server'
import { pruneAnalyticsEvents } from '@/features/analytics/prune'
import { isCronRequestAuthorized } from '@/lib/cron-auth'
import { serverEnv } from '@/lib/env.server'

export const dynamic = 'force-dynamic'

/**
 * Haftalık istatistik temizliği (vercel.json → crons): saklama süresini geçen olayları siler.
 * Vercel, CRON_SECRET tanımlıysa isteğe Bearer başlığını kendisi ekler.
 */
export async function GET(request: Request): Promise<NextResponse> {
  if (!isCronRequestAuthorized(request, serverEnv.CRON_SECRET)) {
    const status = serverEnv.CRON_SECRET ? 401 : 503
    return NextResponse.json({ error: 'Yetkisiz' }, { status })
  }
  const report = await pruneAnalyticsEvents()
  return NextResponse.json(report)
}
