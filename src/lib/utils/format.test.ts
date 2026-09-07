import { describe, expect, it } from 'vitest'
import {
  formatPrice,
  formatPriceWithUnit,
  formatTrPhone,
  normalizeTrPhone,
  telHref,
  whatsappHref,
} from './format'

describe('formatPrice', () => {
  it('tam sayıda kuruş göstermez', () => {
    expect(formatPrice(120)).toBe('₺120')
    expect(formatPrice('120.00')).toBe('₺120')
  })

  it('kuruş varsa gösterir, binlik ayracı kullanır', () => {
    expect(formatPrice(120.5)).toBe('₺120,50')
    expect(formatPrice(1400)).toBe('₺1.400')
  })

  it('Decimal benzeri nesneyi kabul eder', () => {
    expect(formatPrice({ toString: () => '90.00' })).toBe('₺90')
  })

  it('geçersiz değerde boş döner', () => {
    expect(formatPrice('abc')).toBe('')
  })

  it('birimle birleştirir', () => {
    expect(formatPriceWithUnit(120, 'saat')).toBe('₺120 / saat')
    expect(formatPriceWithUnit(120, null)).toBe('₺120')
  })
})

describe('telefon', () => {
  it('farklı yazımları normalize eder', () => {
    expect(normalizeTrPhone('0532 123 45 67')).toBe('905321234567')
    expect(normalizeTrPhone('+90 (532) 123 45 67')).toBe('905321234567')
    expect(normalizeTrPhone('5321234567')).toBe('905321234567')
  })

  it('geçersiz numarada null döner', () => {
    expect(normalizeTrPhone('123')).toBeNull()
    expect(normalizeTrPhone('')).toBeNull()
  })

  it('görüntü biçimi üretir', () => {
    expect(formatTrPhone('905321234567')).toBe('0532 123 45 67')
    expect(formatTrPhone('geçersiz')).toBe('geçersiz')
  })

  it('tel ve WhatsApp bağlantıları üretir', () => {
    expect(telHref('0532 123 45 67')).toBe('tel:+905321234567')
    expect(whatsappHref('0532 123 45 67')).toBe('https://wa.me/905321234567')
    expect(whatsappHref('0532 123 45 67', 'Merhaba')).toBe(
      'https://wa.me/905321234567?text=Merhaba',
    )
    expect(whatsappHref('12')).toBeNull()
  })
})
