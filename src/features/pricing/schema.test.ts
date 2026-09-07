import { describe, expect, it } from 'vitest'
import { priceItemSchema } from './schema'

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
