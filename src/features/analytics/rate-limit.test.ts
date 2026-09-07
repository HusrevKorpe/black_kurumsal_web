import { beforeEach, describe, expect, it } from 'vitest'
import { checkRateLimit, RATE_LIMIT, resetRateLimit } from './rate-limit'

beforeEach(resetRateLimit)

describe('istek sınırı', () => {
  it('sınıra kadar geçirir, sonrasını reddeder', () => {
    const now = 1_000_000
    for (let i = 0; i < RATE_LIMIT; i += 1) {
      expect(checkRateLimit('ziyaretci', now)).toBe(true)
    }
    expect(checkRateLimit('ziyaretci', now)).toBe(false)
  })

  it('pencere dolunca sayaç sıfırlanır', () => {
    const now = 1_000_000
    for (let i = 0; i <= RATE_LIMIT; i += 1) checkRateLimit('ziyaretci', now)
    expect(checkRateLimit('ziyaretci', now + 60_001)).toBe(true)
  })

  it('ziyaretçiler birbirini etkilemez', () => {
    const now = 1_000_000
    for (let i = 0; i <= RATE_LIMIT; i += 1) checkRateLimit('bir', now)
    expect(checkRateLimit('iki', now)).toBe(true)
  })
})
