import 'dotenv/config'
import { ensureContentSkeleton, type SkeletonPart } from '@/features/content/skeleton'
import { db } from '@/lib/db'

/**
 * İçerik iskeleti (canlı ilk kurulum): site ayarı, 3 mekan/bölge ve 11 dükkan. Yalnızca eksik olanları
 * açar; var olan kayıtlara ve panelden yapılan düzenlemelere dokunmaz (tekrar çalıştırmak güvenlidir).
 *   pnpm content:init                                   → yerel
 *   DOTENV_CONFIG_PATH=.env.canli pnpm content:init     → canlı
 * Telefon, adres, saat, fiyat, açıklama ve görseller panelden girilir; seed canlıda çalıştırılmaz.
 */
function describe(label: string, part: SkeletonPart): string {
  const detail = part.created.length > 0 ? ` (${part.created.join(', ')})` : ''
  return `${label}: ${part.created.length} açıldı, ${part.existing.length} zaten vardı${detail}`
}

async function main(): Promise<void> {
  const result = await ensureContentSkeleton(db)
  const lines = [
    `Site ayarı : ${result.settingsCreated ? 'açıldı' : 'zaten vardı'}`,
    describe('Mekan/bölge', result.locations),
    describe('Dükkan', result.shops),
  ]
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
