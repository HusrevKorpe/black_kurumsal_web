import { describe, expect, it } from 'vitest'
import { coverFocusSchema, coverObjectPosition, normalizeFocusY } from './cover-focus'

describe('coverFocusSchema', () => {
  it('0–100 arası tam sayıyı ve boşu kabul eder', () => {
    for (const focusY of [0, 34, 100, null]) {
      expect(coverFocusSchema.safeParse({ focusY }).success).toBe(true)
    }
  })

  it('aralık dışını ve kesirliyi reddeder', () => {
    for (const focusY of [-1, 101, 12.5, '40']) {
      expect(coverFocusSchema.safeParse({ focusY }).success).toBe(false)
    }
  })
})

describe('normalizeFocusY', () => {
  it('50 ortası demektir, boş kaydedilir', () => {
    expect(normalizeFocusY(50)).toBeNull()
    expect(normalizeFocusY(34)).toBe(34)
    expect(normalizeFocusY(null)).toBeNull()
  })
})

describe('coverObjectPosition', () => {
  it('odak yoksa stil vermez', () => {
    expect(coverObjectPosition(null)).toBeUndefined()
    expect(coverObjectPosition(undefined)).toBeUndefined()
  })

  it('dikey yüzdeyi yatay ortayla yazar', () => {
    expect(coverObjectPosition(0)).toBe('50% 0%')
    expect(coverObjectPosition(40)).toBe('50% 40%')
  })
})
