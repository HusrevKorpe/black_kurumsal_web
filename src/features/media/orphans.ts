import 'server-only'
import { logAudit } from '@/features/audit/log'
import { db } from '@/lib/db'
import { serverEnv } from '@/lib/env.server'
import { listAllObjects, removeObjects } from './storage'

/**
 * Yükleme iki adımlıdır (dosya → Media kaydı → form kaydı). Formu henüz kaydedilmemiş taze
 * yüklemeler yetim görünür; bu süreden yeni olan hiçbir şeye dokunulmaz.
 */
export const DEFAULT_GRACE_HOURS = 24

export interface OrphanCleanupOptions {
  /** true (varsayılan): yalnızca raporla, hiçbir şey silme. */
  dryRun?: boolean
  graceHours?: number
  now?: Date
}

export interface OrphanReport {
  dryRun: boolean
  cutoff: string
  /** Hiçbir kayda bağlı olmayan Media satırlarının yolları. */
  orphanRows: string[]
  /** Media satırı olmayan depolama dosyaları. */
  orphanObjects: string[]
  deletedRows: number
  removedObjects: number
}

/** Media'ya işaret eden her ilişki boş: kapak, logo, galeri, kampanya, fiyat kalemi, site logosu. */
const NO_REFERENCE = {
  galleryImage: null,
  shopCovers: { none: {} },
  shopLogos: { none: {} },
  locationCovers: { none: {} },
  campaigns: { none: {} },
  priceItems: { none: {} },
  siteLogos: { none: {} },
} as const

async function findOrphanRows(cutoff: Date) {
  return db.media.findMany({
    where: {
      ...NO_REFERENCE,
      bucket: serverEnv.SUPABASE_STORAGE_BUCKET,
      createdAt: { lt: cutoff },
    },
    select: { id: true, path: true },
    orderBy: { path: 'asc' },
  })
}

async function findOrphanObjects(cutoff: Date): Promise<string[]> {
  const [objects, rows] = await Promise.all([
    listAllObjects(),
    db.media.findMany({ select: { path: true } }),
  ])
  const known = new Set(rows.map((row) => row.path))
  return objects
    .filter((o) => !known.has(o.path) && o.createdAt !== null && o.createdAt < cutoff)
    .map((o) => o.path)
    .sort()
}

/**
 * Yetim medyayı bulur ve (dryRun=false ise) siler. Önce DB satırları tek transaction'da,
 * ardından dosyalar; silme anında bağlılık yeniden kontrol edilir (arada kapak yapılmış olabilir).
 */
export async function cleanupOrphanMedia(
  options: OrphanCleanupOptions = {},
): Promise<OrphanReport> {
  const { dryRun = true, graceHours = DEFAULT_GRACE_HOURS, now = new Date() } = options
  const cutoff = new Date(now.getTime() - graceHours * 3_600_000)
  const rows = await findOrphanRows(cutoff)
  const orphanObjects = await findOrphanObjects(cutoff)
  const report: OrphanReport = {
    dryRun,
    cutoff: cutoff.toISOString(),
    orphanRows: rows.map((row) => row.path),
    orphanObjects,
    deletedRows: 0,
    removedObjects: 0,
  }
  if (dryRun || (rows.length === 0 && orphanObjects.length === 0)) return report

  const deletedPaths = await db.$transaction(async (tx) => {
    const stillOrphan = await tx.media.findMany({
      where: { ...NO_REFERENCE, id: { in: rows.map((row) => row.id) } },
      select: { id: true, path: true },
    })
    if (stillOrphan.length > 0) {
      await tx.media.deleteMany({ where: { id: { in: stillOrphan.map((m) => m.id) } } })
    }
    const paths = stillOrphan.map((m) => m.path)
    await logAudit(tx, {
      staffId: null,
      action: 'media.cleanup',
      entityType: 'Media',
      summary: `Yetim medya temizliği: ${paths.length} kayıt, ${paths.length + orphanObjects.length} dosya silindi`,
      data: { rows: paths, objects: orphanObjects },
    })
    return paths
  })

  const toRemove = [...deletedPaths, ...orphanObjects]
  await removeObjects(toRemove)
  report.deletedRows = deletedPaths.length
  report.removedObjects = toRemove.length
  return report
}
