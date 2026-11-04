import { randomUUID } from 'node:crypto'
import { logAudit } from '@/features/audit/log'
import { buildMediaPath } from '@/features/media/paths'
import type { PrismaClient } from '@/generated/prisma/client'
import {
  GAME_CATEGORY_DESCRIPTION,
  GAME_CATEGORY_NAME,
  GAMES,
  SHOP_GAMES,
  gameDescription,
  type GameShopSlug,
  type GameSlug,
} from './games-data'

/**
 * Oyun vitrinini (`pnpm content:games`) yazar: dükkanın "Oyunlar" kategorisinin kalemleri
 * `games-data.ts`'teki listeyle DEĞİŞTİRİLİR, her oyuna kapağı bağlanır. Dükkanın diğer kategorilerine
 * (fiyatlar, içecekler) dokunulmaz. Panelde bu kategoride yapılan değişiklik yeniden çalıştırmada gider.
 * Kapak yolu panelin kalem görseliyle aynıdır (`price-item/<shopId>/<uuid>.webp`): panelden değişir.
 */
const TX_OPTIONS = { timeout: 60_000 }
const ACTION = 'content.games'
const MIME = 'image/webp'

export interface CoverFile {
  body: Buffer
  width: number
  height: number
}

/** Depolama ve kapak okuma dışarıdan verilir: test sahte depoyla, komut Supabase ile çalışır. */
export interface GamesIO {
  readCover: (slug: GameSlug) => Promise<CoverFile>
  upload: (path: string, body: Buffer, contentType: string) => Promise<void>
  remove: (paths: string[]) => Promise<void>
}

export interface GameShopPlan {
  slug: GameShopSlug
  /** null: dükkan yok ya da çöpte; atlanır. */
  shopId: string | null
  name: string | null
  games: string[]
  /** Kategoride şu an duran kalem sayısı; null ise kategori yok, açılacak. */
  replacing: number | null
}

function isGameCategory(name: string): boolean {
  return name.trim().toLocaleLowerCase('tr') === GAME_CATEGORY_NAME.toLocaleLowerCase('tr')
}

export async function planGames(db: PrismaClient): Promise<GameShopPlan[]> {
  const plans: GameShopPlan[] = []
  for (const slug of Object.keys(SHOP_GAMES) as GameShopSlug[]) {
    const shop = await db.shop.findFirst({
      where: { slug, deletedAt: null },
      select: {
        id: true,
        name: true,
        priceCategories: { select: { name: true, _count: { select: { items: true } } } },
      },
    })
    const existing = shop?.priceCategories.find((c) => isGameCategory(c.name))
    plans.push({
      slug,
      shopId: shop?.id ?? null,
      name: shop?.name ?? null,
      games: SHOP_GAMES[slug].map((game) => GAMES[game].name),
      replacing: existing ? existing._count.items : null,
    })
  }
  return plans
}

interface PreparedGame {
  slug: GameSlug
  path: string
  cover: CoverFile
}

/** Yazar ve planı döndürür. Kapaklar önce yüklenir; yazma bozulursa yüklenen dosyalar silinir. */
export async function applyGames(db: PrismaClient, io: GamesIO): Promise<GameShopPlan[]> {
  const plans = await planGames(db)
  for (const plan of plans) {
    const shopId = plan.shopId
    if (!shopId) continue
    const prepared: PreparedGame[] = []
    for (const slug of SHOP_GAMES[plan.slug]) {
      prepared.push({
        slug,
        path: buildMediaPath('price-item', shopId, MIME, randomUUID()),
        cover: await io.readCover(slug),
      })
    }
    for (const game of prepared) await io.upload(game.path, game.cover.body, MIME)

    let stale: string[]
    try {
      stale = await db.$transaction(async (tx) => {
        const categories = await tx.priceCategory.findMany({
          where: { shopId },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            name: true,
            sortOrder: true,
            items: { select: { imageId: true, image: { select: { path: true } } } },
          },
        })
        const existing = categories.find((c) => isGameCategory(c.name))
        const lastOrder = categories.reduce((max, c) => Math.max(max, c.sortOrder), -1)
        const category = existing
          ? await tx.priceCategory.update({
              where: { id: existing.id },
              data: {
                name: GAME_CATEGORY_NAME,
                description: GAME_CATEGORY_DESCRIPTION,
                isActive: true,
              },
              select: { id: true },
            })
          : await tx.priceCategory.create({
              data: {
                shopId,
                name: GAME_CATEGORY_NAME,
                description: GAME_CATEGORY_DESCRIPTION,
                sortOrder: lastOrder + 1,
              },
              select: { id: true },
            })

        // Eski kalemlerin kapakları: yalnızca bu dükkanın kalem görselleri silinir.
        const prefix = `price-item/${shopId}/`
        const oldImages = (existing?.items ?? []).flatMap((item) =>
          item.imageId && item.image?.path.startsWith(prefix)
            ? [{ id: item.imageId, path: item.image.path }]
            : [],
        )
        await tx.priceItem.deleteMany({ where: { categoryId: category.id } })
        if (oldImages.length > 0)
          await tx.media.deleteMany({ where: { id: { in: oldImages.map((i) => i.id) } } })

        for (const [sortOrder, game] of prepared.entries()) {
          const entry = GAMES[game.slug]
          const media = await tx.media.create({
            data: {
              path: game.path,
              mimeType: MIME,
              sizeBytes: game.cover.body.byteLength,
              width: game.cover.width,
              height: game.cover.height,
              alt: `${entry.name} oyun kapağı`,
            },
            select: { id: true },
          })
          await tx.priceItem.create({
            data: {
              categoryId: category.id,
              name: entry.name,
              description: gameDescription(entry),
              price: null,
              imageId: media.id,
              sortOrder,
            },
          })
        }

        await logAudit(tx, {
          staffId: null,
          action: ACTION,
          entityType: 'Shop',
          entityId: shopId,
          summary: `${plan.name}: oyun vitrini yazıldı (${prepared.length} oyun)`,
          data: { games: prepared.map((g) => g.slug), replaced: plan.replacing ?? 0 },
        })
        return oldImages.map((i) => i.path)
      }, TX_OPTIONS)
    } catch (error) {
      await io.remove(prepared.map((g) => g.path))
      throw error
    }
    await io.remove(stale)
  }
  return plans
}
