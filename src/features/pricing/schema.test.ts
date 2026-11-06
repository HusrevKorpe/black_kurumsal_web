import { describe, expect, it } from 'vitest'
import { priceItemSchema, reorderSchema } from './schema'

const base = {
  categoryId: 'c1',
  name: 'PS5 Saatlik',
  description: '',
  unit: 'saat',
  isAvailable: true,
  isFeatured: false,
}

describe('priceItemSchema', () => {
  it('virgüllü Türkçe fiyatı sayıya çevirir', () => {
    const result = priceItemSchema.parse({ ...base, price: '120,50' })
    expect(result.price).toBe(120.5)
    expect(result.description).toBeNull()
  })

  it('boş fiyatı null yapar (bilgi listesi)', () => {
    expect(priceItemSchema.parse({ ...base, price: '' }).price).toBeNull()
    expect(priceItemSchema.parse({ ...base, price: null }).price).toBeNull()
  })

  it('negatif ve sayı olmayan fiyatı reddeder', () => {
    expect(priceItemSchema.safeParse({ ...base, price: -1 }).success).toBe(false)
    expect(priceItemSchema.safeParse({ ...base, price: 'abc' }).success).toBe(false)
  })
})

describe('reorderSchema', () => {
  const a = '01a1a548-11b4-708d-9a88-e990c63bbb7f'
  const b = '01a1a548-11b7-74d0-a0e1-8599f28e6ed4'

  it('her kimlik bir kez geçen listeyi kabul eder', () => {
    expect(reorderSchema.safeParse({ ids: [a, b] }).success).toBe(true)
  })

  it('aynı kimlik iki kez gelirse reddeder (diğer kayıt sırasız kalırdı)', () => {
    expect(reorderSchema.safeParse({ ids: [a, a] }).success).toBe(false)
  })
})
