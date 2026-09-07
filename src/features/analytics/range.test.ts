import { describe, expect, it } from 'vitest'
import { buildRange, DEFAULT_RANGE, parseRange, zonedDayStart } from './range'

describe('aralık seçimi', () => {
  it('yalnızca tanımlı aralıkları kabul eder', () => {
    expect(parseRange('7')).toBe(7)
    expect(parseRange('90')).toBe(90)
    expect(parseRange(['30'])).toBe(30)
  })

  it('tanımsız değerde varsayılana döner', () => {
    expect(parseRange(undefined)).toBe(DEFAULT_RANGE)
    expect(parseRange('365')).toBe(DEFAULT_RANGE)
    expect(parseRange('bir sürü')).toBe(DEFAULT_RANGE)
  })
})

describe('gün başlangıcı', () => {
  it('İstanbul gece yarısı UTC 21:00 olur (UTC+3)', () => {
    expect(zonedDayStart('2026-09-07').toISOString()).toBe('2026-09-06T21:00:00.000Z')
  })
})

describe('aralık kurma', () => {
  it('bugün dahil geriye doğru gün anahtarları üretir', () => {
    const range = buildRange(new Date('2026-09-07T10:00:00.000Z'), 7)
    expect(range.dayKeys).toHaveLength(7)
    expect(range.dayKeys[0]).toBe('2026-09-01')
    expect(range.dayKeys.at(-1)).toBe('2026-09-07')
    expect(range.from.toISOString()).toBe('2026-08-31T21:00:00.000Z')
  })

  it('gün sınırı İstanbul saatine göre çizilir', () => {
    // UTC 22:00 = İstanbul'da ertesi gün 01:00; aralık o günü kapsamalı.
    const range = buildRange(new Date('2026-09-07T22:00:00.000Z'), 7)
    expect(range.dayKeys.at(-1)).toBe('2026-09-08')
  })
})
