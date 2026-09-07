import 'dotenv/config'
import { cleanupOrphanMedia, DEFAULT_GRACE_HOURS } from '@/features/media/orphans'
import { db } from '@/lib/db'

/**
 * Yetim medya temizliği (yerel / elle). Varsayılan kuru çalışma: yalnızca raporlar.
 *   pnpm media:cleanup               → raporla
 *   pnpm media:cleanup --apply       → sil
 *   pnpm media:cleanup --grace=48    → 48 saatten yeni dosyalara dokunma
 * Canlıda aynı iş /api/cron/medya-temizle ile haftalık otomatik çalışır.
 */
function readGraceHours(args: string[]): number {
  const raw = args.find((arg) => arg.startsWith('--grace='))?.slice('--grace='.length)
  if (raw === undefined) return DEFAULT_GRACE_HOURS
  const hours = Number(raw)
  if (!Number.isFinite(hours) || hours < 0) throw new Error(`Geçersiz --grace değeri: ${raw}`)
  return hours
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const report = await cleanupOrphanMedia({
    dryRun: !args.includes('--apply'),
    graceHours: readGraceHours(args),
  })
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
  const found = report.orphanRows.length + report.orphanObjects.length
  if (report.dryRun && found > 0) {
    process.stdout.write(`${found} yetim bulundu. Silmek için: pnpm media:cleanup --apply\n`)
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.$disconnect()
  })
