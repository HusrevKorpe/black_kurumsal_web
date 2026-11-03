import 'dotenv/config'
import { applyCleanup, planCleanup, type RecordPlan } from '@/features/content/cleanup'
import { db } from '@/lib/db'

/**
 * Demo temizliği: canlıdaki uydurma telefon, adres, açıklama, fiyat ve kampanyaları açık siteden çıkarır
 * (kurallar `src/features/content/cleanup.ts`'te). Yalnızca demo değeriyle birebir aynı alanlara dokunur.
 *   pnpm content:clean                                         → yalnızca raporlar (kuru çalışma)
 *   pnpm content:clean --apply                                 → yerele yazar
 *   DOTENV_CONFIG_PATH=.env.canli pnpm content:clean --apply   → canlıya yazar
 *
 * Açık site 1 saat önbellekli: değişiklik en geç bir saat içinde, panelden yapılacak ilk düzenlemede ya
 * da yeni deploy'da hemen görünür.
 */
const LABELS: Record<string, string> = {
  description: 'açıklama',
  address: 'adres',
  mapUrl: 'harita',
  phone: 'telefon',
  whatsapp: 'WhatsApp',
  instagramUrl: 'Instagram',
}

function describe(plan: RecordPlan): string {
  const lines = [`${plan.slug} (${plan.name})`]
  for (const [field, value] of Object.entries(plan.cleared)) {
    lines.push(`  ${(LABELS[field] ?? field).padEnd(10)}: "${value}" → boş`)
  }
  if (plan.clearFeatures) lines.push(`  özellik   : ${plan.clearFeatures.join(', ')} → boş`)
  if (plan.deleteHours) lines.push(`  saat      : ${plan.deleteHours} (demo) → silinir`)
  for (const category of plan.hideCategories) {
    lines.push(`  fiyat     : "${category.name}" (demo) → yayından kalkar`)
  }
  if (plan.hide) lines.push('  durum     : yayında → gizli')
  return lines.join('\n')
}

async function main(): Promise<void> {
  const apply = process.argv.slice(2).includes('--apply')
  const plan = apply ? await applyCleanup(db) : await planCleanup(db)

  const blocks = [...plan.shops, ...plan.locations].map(describe)
  if (plan.campaigns.length > 0) {
    blocks.push(
      ['kampanyalar', ...plan.campaigns.map((c) => `  "${c.title}" → yayından kalkar`)].join('\n'),
    )
  }
  const total = plan.shops.length + plan.locations.length + plan.campaigns.length
  if (total === 0) {
    process.stdout.write('Temizlenecek demo bilgisi kalmamış.\n')
    return
  }
  process.stdout.write(`${blocks.join('\n\n')}\n\n`)
  process.stdout.write(
    apply
      ? `Temizlendi: ${plan.shops.length} dükkan, ${plan.locations.length} mekan, ${plan.campaigns.length} kampanya.\n`
      : `Kuru çalışma: ${total} kayıt değişecek. Yazmak için --apply ekleyin.\n`,
  )
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.$disconnect()
  })
