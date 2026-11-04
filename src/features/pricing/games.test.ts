import { describe, expect, it } from 'vitest'
import { isGameShelf, readGameMeta } from './games'
import type { PriceCategoryView, PriceItemView } from './view'

const image = { bucket: 'media', path: 'price-item/s/x.webp', alt: null, width: 600, height: 900 }

function item(overrides: Partial<PriceItemView>): PriceItemView {
  return {
    id: 'i',
    name: 'Tekken 8',
    description: null,
    price: null,
    unit: null,
    isAvailable: true,
    isFeatured: false,
    image: null,
    ...overrides,
  }
}

function category(items: PriceItemView[]): PriceCategoryView {
  return { id: 'c', name: 'Oyunlar', description: null, isActive: true, items }
}

describe('isGameShelf', () => {
  it('fiyatsız ve en az bir kapaklı kategori vitrindir', () => {
    expect(isGameShelf(category([item({ image }), item({})]))).toBe(true)
  })

  it('kapaksız liste, fiyatlı kalem ya da boş kategori vitrin değildir', () => {
    expect(isGameShelf(category([item({})]))).toBe(false)
    expect(isGameShelf(category([item({ image }), item({ price: '150' })]))).toBe(false)
    expect(isGameShelf(category([]))).toBe(false)
  })
})

describe('readGameMeta', () => {
  it('türü ve oyuncu sayısını ayırır, sıra önemsiz', () => {
    expect(readGameMeta('Spor / Futbol · 1-4 Oyuncu')).toEqual({
      genre: 'Spor / Futbol',
      players: '1-4 Oyuncu',
    })
    expect(readGameMeta('2 oyuncu | Ortak Macera')).toEqual({
      genre: 'Ortak Macera',
      players: '2 oyuncu',
    })
  })

  it('oyuncu bilgisi yoksa hepsi tür, boşsa ikisi de null', () => {
    expect(readGameMeta('Dövüş')).toEqual({ genre: 'Dövüş', players: null })
    expect(readGameMeta(null)).toEqual({ genre: null, players: null })
    expect(readGameMeta('  ')).toEqual({ genre: null, players: null })
  })
})
