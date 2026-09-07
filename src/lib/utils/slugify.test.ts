import { describe, expect, it } from 'vitest'
import { isReservedSlug, isValidSlug, slugify } from './slugify'

describe('slugify', () => {
  it('Türkçe karakterleri sadeleştirir', () => {
    expect(slugify('Black İnternet Kafe Çarşı')).toBe('black-internet-kafe-carsi')
    expect(slugify('Iyaş Şube Ğüzel Öğün')).toBe('iyas-sube-guzel-ogun')
  })

  it('boşluk ve noktalama işaretlerini tire yapar, baş/son tireyi siler', () => {
    expect(slugify('  Black   PlayStation -- Iyaş! ')).toBe('black-playstation-iyas')
    expect(slugify('Lavinya Apart.')).toBe('lavinya-apart')
  })

  it('boş girdiye boş slug döner', () => {
    expect(slugify('   ')).toBe('')
    expect(slugify('!!!')).toBe('')
  })
})

describe('isValidSlug', () => {
  it('geçerli slugları kabul eder', () => {
    expect(isValidSlug('black-tost-garden')).toBe(true)
    expect(isValidSlug('ps5')).toBe(true)
  })

  it('geçersizleri reddeder', () => {
    expect(isValidSlug('Black')).toBe(false)
    expect(isValidSlug('-black')).toBe(false)
    expect(isValidSlug('black--tost')).toBe(false)
    expect(isValidSlug('a')).toBe(false)
    expect(isValidSlug('a'.repeat(81))).toBe(false)
  })
})

describe('isReservedSlug', () => {
  it('rota kelimelerini rezerve sayar', () => {
    expect(isReservedSlug('admin')).toBe(true)
    expect(isReservedSlug('mekan')).toBe(true)
    expect(isReservedSlug('kampanyalar')).toBe(true)
    expect(isReservedSlug('black-tost-carsi')).toBe(false)
  })
})
