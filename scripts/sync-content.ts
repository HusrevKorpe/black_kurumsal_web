import 'dotenv/config'
import { applySync, isEmptyPlan, planSync, type SyncPart } from '@/features/content/sync'
import { db } from '@/lib/db'

/**
 * Dükkan listesini `skeleton-data.ts`'e eşitler (kurallar `src/features/content/sync.ts`'te).
 *   pnpm content:sync                                         → yalnızca raporlar (kuru çalışma)
 *   pnpm content:sync --apply                                 → yerele yazar
 *   DOTENV_CONFIG_PATH=.env.canli pnpm content:sync --apply   → canlıya yazar
 * Açık site 1 saat önbellekli; değişiklik en geç bir saatte ya da yeni deploy'da görünür.
 */
function describe(label: string, part: SyncPart): string[] {
  const lines: string[] = []
  for (const row of part.archive)
    lines.push(`  ${label} eski kayıt  : ${row.slug} → ${row.to} (çöpte kalır)`)
  for (const row of part.create) lines.push(`  ${label} açılır     : ${row.slug} (${row.name})`)
  for (const row of part.update)
    lines.push(`  ${label} güncellenir: ${row.slug} — ${row.fields.join(', ')}`)
  for (const row of part.remove) lines.push(`  ${label} silinir    : ${row.slug} (${row.name})`)
  return lines
}

async function main(): Promise<void> {
  const apply = process.argv.slice(2).includes('--apply')
  const plan = apply ? await applySync(db) : await planSync(db)
  if (isEmptyPlan(plan)) {
    process.stdout.write('Dükkan listesi zaten güncel.\n')
    return
  }
  const lines = [...describe('mekan ', plan.locations), ...describe('dükkan', plan.shops)]
  process.stdout.write(`${lines.join('\n')}\n\n`)
  process.stdout.write(apply ? 'Yazıldı.\n' : 'Kuru çalışma. Yazmak için --apply ekleyin.\n')
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.$disconnect()
  })
