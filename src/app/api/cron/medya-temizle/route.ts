import { NextResponse } from 'next/server'
import { cleanupOrphanMedia } from '@/features/media/orphans'
import { isCronRequestAuthorized } from '@/lib/cron-auth'
import { serverEnv } from '@/lib/env.server'

export const dynamic = 'force-dynamic'
/** Depolama taraması + silme; küçük sitede bile varsayılan süreyi aşabilir. */
export const maxDuration = 120

/**
 * Haftalık yetim medya temizliği (vercel.json → crons). `?dryRun=1` ile yalnızca rapor.
 * Vercel, CRON_SECRET tanımlıysa isteğe Bearer başlığını kendisi ekler.
 */
export async function GET(request: Request): Promise<NextResponse> {
  if (!isCronRequestAuthorized(request, serverEnv.CRON_SECRET)) {
    const status = serverEnv.CRON_SECRET ? 401 : 503
    return NextResponse.json({ error: 'Yetkisiz' }, { status })
  }
  const dryRun = new URL(request.url).searchParams.get('dryRun') === '1'
  const report = await cleanupOrphanMedia({ dryRun })
  return NextResponse.json(report)
}
