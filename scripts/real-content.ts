import 'dotenv/config'
import { applyRealContent, planRealContent, type RealShopPlan } from '@/features/content/real'
import { db } from '@/lib/db'

/**
 * Gerçek içerik: patronun gönderdiği fiyat listelerini ve çalışma saatlerini dükkanlara yazar
 * (`src/features/content/real-data.ts` tek doğruluk kaynağıdır).
 *   pnpm content:real                                          → yalnızca raporlar (kuru çalışma)
 *   pnpm content:real --apply                                  → yerele yazar
 *   pnpm content:real --dukkan=black-tost-carsi --apply        → tek dükkan
 *   DOTENV_CONFIG_PATH=.env.canli pnpm content:real --apply    → canlıya yazar
 *
 * Dükkanın fiyat listesinin tamamı değiştirilir: eski (çoğunlukla demo) kategoriler silinir, yerine
 * gerçek liste yazılır. Rapor hangi kategorilerin silineceğini önceden gösterir. Telefon, adres,
 * açıklama ve görsellere dokunulmaz. Açık site 1 saat önbellekli: değişiklik en geç bir saat içinde,
 * panelden yapılacak ilk düzenlemede ya da yeni deploy'da hemen görünür.
 */
const SHOPS_ARG = '--dukkan='

function readShopSlugs(args: string[]): readonly string[] | undefined {
  const raw = args.find((arg) => arg.startsWith(SHOPS_ARG))
  if (!raw) return undefined
  return raw
    .slice(SHOPS_ARG.length)
    .split(',')
    .map((slug) => slug.trim())
    .filter((slug) => slug.length > 0)
}

function describe(plan: RealShopPlan): string {
  const lines = [`${plan.slug} (${plan.name})`, `  kaynak : ${plan.source}`]
  if (plan.hours) {
    const from = plan.hours.from ?? 'kendi saati yoktu'
    lines.push(`  saat   : ${from} → ${plan.hours.to} (7 gün)`)
  }
  if (plan.categories > 0) {
    lines.push(`  fiyat  : ${plan.categories} kategori, ${plan.items} ürün yazılacak`)
    const replaced = plan.replaced.map((c) => `${c.name} (${c.items})`).join(', ')
    lines.push(`  silinen: ${replaced.length > 0 ? replaced : 'yok, liste boştu'}`)
  }
  return lines.join('\n')
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const slugs = readShopSlugs(args)
  const apply = args.includes('--apply')

  const plans = apply ? await applyRealContent(db, slugs) : await planRealContent(db, slugs)
  process.stdout.write(`${plans.map(describe).join('\n\n')}\n\n`)

  const items = plans.reduce((sum, plan) => sum + plan.items, 0)
  process.stdout.write(
    apply
      ? `${plans.length} dükkan güncellendi, ${items} ürün yazıldı.\n`
      : `Kuru çalışma: ${plans.length} dükkan, ${items} ürün hazır. Yazmak için --apply ekleyin.\n`,
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
