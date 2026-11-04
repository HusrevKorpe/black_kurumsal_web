import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'
import { applyGames, planGames, type GameShopPlan, type GamesIO } from '@/features/content/games'
import { db } from '@/lib/db'
import { serverEnv } from '@/lib/env.server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

/**
 * Oyun vitrini: PlayStation dükkanlarının "Oyunlar" kategorisini kapaklı oyun kartlarıyla doldurur
 * (liste `src/features/content/games-data.ts`, kapaklar `scripts/assets/games/`).
 *   pnpm content:games                                          → yalnızca raporlar (kuru çalışma)
 *   pnpm content:games --apply                                  → yerele yazar
 *   DOTENV_CONFIG_PATH=.env.canli pnpm content:games --apply    → canlıya yazar
 * Yalnızca "Oyunlar" kategorisi değişir; fiyatlara dokunulmaz. Açık site 1 saat önbellekli.
 */
const COVERS = join(import.meta.dirname, 'assets', 'games')

function describe(plan: GameShopPlan): string {
  if (!plan.shopId) return `${plan.slug}: dükkan yok ya da çöpte, atlandı`
  const before =
    plan.replacing === null ? 'kategori yok, açılacak' : `${plan.replacing} eski kalem silinecek`
  return `${plan.slug} (${plan.name}): ${plan.games.length} oyun, ${before}\n  ${plan.games.join(', ')}`
}

function supabaseIO(): GamesIO {
  const bucket = createSupabaseAdminClient().storage.from(serverEnv.SUPABASE_STORAGE_BUCKET)
  return {
    async readCover(slug) {
      const body = await readFile(join(COVERS, `${slug}.webp`))
      const meta = await sharp(body).metadata()
      return { body, width: meta.width as number, height: meta.height as number }
    },
    async upload(path, body, contentType) {
      const { error } = await bucket.upload(path, body, { contentType, upsert: false })
      if (error) throw new Error(`Depolamaya yüklenemedi (${path}): ${error.message}`)
    },
    async remove(paths) {
      if (paths.length === 0) return
      const { error } = await bucket.remove(paths)
      // DB satırı zaten silindi; dosya kalırsa haftalık yetim temizliği alır.
      if (error) console.error('[storage] eski kapaklar silinemedi', paths, error.message)
    },
  }
}

async function main(): Promise<void> {
  const apply = process.argv.slice(2).includes('--apply')
  const plans = apply ? await applyGames(db, supabaseIO()) : await planGames(db)
  process.stdout.write(`${plans.map(describe).join('\n')}\n\n`)
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
