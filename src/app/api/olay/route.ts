import * as Sentry from '@sentry/nextjs'
import { recordEvent } from '@/features/analytics/service'

export const dynamic = 'force-dynamic'

/** Gövde birkaç yüz bayttır; büyüğü okumadan atılır. */
const MAX_BODY_BYTES = 2000

/**
 * Tarayıcının `sendBeacon` ile bıraktığı sayfa görüntüleme / tıklama olayları.
 * Her durumda 204 döner: ziyaretçi ne yazıldığını, neden yazılmadığını öğrenmez ve
 * sayaç hatası hiçbir zaman sayfayı etkilemez.
 */
export async function POST(request: Request): Promise<Response> {
  const noContent = new Response(null, { status: 204 })
  const length = Number(request.headers.get('content-length') ?? 0)
  if (length > MAX_BODY_BYTES) return noContent

  try {
    const body: unknown = await request.json()
    await recordEvent(body, request.headers)
  } catch (error) {
    console.error('[analytics]', error)
    Sentry.captureException(error)
  }
  return noContent
}
