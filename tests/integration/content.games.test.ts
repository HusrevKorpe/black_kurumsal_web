import { beforeEach, describe, expect, it } from 'vitest'
import { applyGames, type GamesIO } from '@/features/content/games'
import { GAMES, SHOP_GAMES } from '@/features/content/games-data'
import { db } from '@/lib/db'
import { createShop, resetDatabase } from './helpers'

beforeEach(resetDatabase)

function fakeIO() {
  const stored = new Set<string>()
  const removed: string[] = []
  const io: GamesIO = {
    readCover: async () => ({ body: Buffer.from('webp'), width: 600, height: 900 }),
    upload: async (path) => {
      stored.add(path)
    },
    remove: async (paths) => {
      removed.push(...paths)
      for (const path of paths) stored.delete(path)
    },
  }
  return { io, stored, removed }
}

describe('oyun vitrini (applyGames)', () => {
  it('"Oyunlar" kategorisini kapaklı oyunlarla değiştirir, fiyatlara dokunmaz; tekrar çalışınca eski kapaklar silinir', async () => {
    const shop = await createShop({
      slug: 'black-playstation-carsi',
      name: 'Black PlayStation Çarşı',
    })
    const prices = await db.priceCategory.create({
      data: {
        shopId: shop.id,
        name: 'Oyun Ücretleri',
        items: { create: [{ name: 'PS5', price: 150, unit: 'saat' }] },
      },
    })
    await db.priceCategory.create({
      data: { shopId: shop.id, name: 'oyunlar', items: { create: [{ name: 'Eski oyun' }] } },
    })

    const { io, stored, removed } = fakeIO()
    const plans = await applyGames(db, io)
    expect(plans.find((p) => p.slug === 'black-playstation-iyas')?.shopId).toBeNull()

    const categories = await db.priceCategory.findMany({
      where: { shopId: shop.id },
      include: { items: { orderBy: { sortOrder: 'asc' }, include: { image: true } } },
    })
    expect(categories).toHaveLength(2)
    const games = categories.find((c) => c.name === 'Oyunlar')
    const expected = SHOP_GAMES['black-playstation-carsi'].map((slug) => GAMES[slug].name)
    expect(games?.items.map((i) => i.name)).toEqual(expected)
    expect(
      games?.items.every(
        (i) => i.price === null && i.image?.path.startsWith(`price-item/${shop.id}/`),
      ),
    ).toBe(true)
    expect(games?.items[0]?.description).toBe('Spor / Futbol · 1-4 Oyuncu')
    expect(categories.find((c) => c.id === prices.id)?.items).toHaveLength(1)
    expect(stored.size).toBe(expected.length)

    const firstPaths = games?.items.map((i) => i.image?.path) ?? []
    await applyGames(db, io)
    expect(removed.sort()).toEqual([...firstPaths].sort())
    expect(stored.size).toBe(expected.length)
    expect(await db.media.count()).toBe(expected.length)
  })
})
