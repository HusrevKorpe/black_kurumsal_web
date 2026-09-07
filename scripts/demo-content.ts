import 'dotenv/config'
import { applyDemoContent, type DemoPart } from '@/features/content/demo'
import { DEFAULT_DEMO_SHOP_SLUGS } from '@/features/content/demo-data'
import { createStorageUploader } from '@/features/content/demo-media'
import { db } from '@/lib/db'
import { serverEnv } from '@/lib/env.server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

/**
 * Örnek içerik: seçili dükkanları açıklama, adres, telefon, saat, özellik, fiyat listesi ve yer tutucu
 * görsellerle doldurur; bağlı mekanı (Black Garden) ve tabloda kampanya yoksa örnek kampanyaları da açar.
 * Yalnızca BOŞ dükkanlara yazar: panelden girilmiş bir alanı olan dükkan atlanır; tekrar çalıştırmak güvenlidir.
 *   pnpm content:demo                                          → yerel, varsayılan 5 dükkan
 *   pnpm content:demo --dukkan=black-tost-carsi,lavinya-apart  → seçili dükkanlar
 *   DOTENV_CONFIG_PATH=.env.canli pnpm content:demo            → canlı
 * Telefon/adres/fiyatlar uydurmadır; patron panelden gerçeğini girer. Açık site 1 saat önbellekli: değişiklik
 * deploy ya da panelden ilk düzenlemeyle hemen görünür.
 */
const SHOPS_ARG = '--dukkan='

function readShopSlugs(args: string[]): readonly string[] {
  const raw = args.find((arg) => arg.startsWith(SHOPS_ARG))
  if (!raw) return DEFAULT_DEMO_SHOP_SLUGS
  return raw
    .slice(SHOPS_ARG.length)
    .split(',')
    .map((slug) => slug.trim())
    .filter((slug) => slug.length > 0)
}

function describe(label: string, part: DemoPart): string {
  const filled = part.filled.length > 0 ? ` (${part.filled.join(', ')})` : ''
  const skipped = part.skipped.length > 0 ? ` — atlanan: ${part.skipped.join(', ')}` : ''
  return `${label}: ${part.filled.length} dolduruldu${filled}, ${part.skipped.length} zaten doluydu${skipped}`
}

async function main(): Promise<void> {
  const upload = createStorageUploader(
    createSupabaseAdminClient(),
    serverEnv.SUPABASE_STORAGE_BUCKET,
  )
  const result = await applyDemoContent(db, {
    upload,
    shopSlugs: readShopSlugs(process.argv.slice(2)),
  })
  const campaigns = result.campaigns.skipped
    ? 'Kampanya   : zaten kampanya var, dokunulmadı'
    : `Kampanya   : ${result.campaigns.created.length} açıldı (${result.campaigns.created.join(', ')})`
  const lines = [describe('Mekan', result.locations), describe('Dükkan', result.shops), campaigns]
  process.stdout.write(`${lines.join('\n')}\n`)
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.$disconnect()
  })
