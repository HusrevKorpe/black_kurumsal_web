import 'server-only'
import { db } from '@/lib/db'

/** Olaylar bu kadar gün saklanır. Sonrası silinir: ücretsiz katmanda veritabanı şişmesin. */
export const RETENTION_DAYS = 400

export interface PruneReport {
  cutoff: string
  deleted: number
}

/**
 * Saklama süresini geçmiş olayları siler. Toplamlar zaten okunmuş raporlarda kalmaz; bu yüzden
 * süre bir yıldan uzun tutulur (geçen yılın aynı ayı karşılaştırılabilsin).
 */
export async function pruneAnalyticsEvents(
  options: { days?: number; now?: Date } = {},
): Promise<PruneReport> {
  const days = options.days ?? RETENTION_DAYS
  const now = options.now ?? new Date()
  const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000)
  const { count } = await db.analyticsEvent.deleteMany({ where: { createdAt: { lt: cutoff } } })
  return { cutoff: cutoff.toISOString(), deleted: count }
}
