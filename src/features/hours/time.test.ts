import { describe, expect, it } from 'vitest'
import { addDays, formatHm, parseHm, previousDay, zonedNow } from './time'

describe('parseHm / formatHm', () => {
  it('HH:mm çözer', () => {
    expect(parseHm('00:00')).toBe(0)
    expect(parseHm('10:30')).toBe(630)
    expect(parseHm('23:59')).toBe(1439)
  })

  it('bozuk biçimi reddeder', () => {
    expect(parseHm('24:00')).toBeNull()
    expect(parseHm('9:00')).toBeNull()
    expect(parseHm('10:60')).toBeNull()
    expect(parseHm('')).toBeNull()
  })

  it('dakikayı HH:mm yapar, gün taşmasını sarar', () => {
    expect(formatHm(630)).toBe('10:30')
    expect(formatHm(1440)).toBe('00:00')
    expect(formatHm(-60)).toBe('23:00')
  })
})

describe('zonedNow', () => {
  it('UTC anı İstanbul saatine çevirir (yaz saati yok, +03:00 sabit)', () => {
    // 2026-09-04 Cuma 22:30 UTC → 05.09 Cumartesi 01:30 İstanbul
    const at = new Date('2026-09-04T22:30:00Z')
    expect(zonedNow(at, 'Europe/Istanbul')).toEqual({ dayOfWeek: 6, minutes: 90 })
  })

  it('Pazar gününü 7 olarak verir', () => {
    const at = new Date('2026-09-06T09:00:00Z') // Pazar 12:00 İstanbul
    expect(zonedNow(at, 'Europe/Istanbul')).toEqual({ dayOfWeek: 7, minutes: 720 })
  })
})

describe('gün aritmetiği', () => {
  it('önceki gün ve gün ekleme haftayı sarar', () => {
    expect(previousDay(1)).toBe(7)
    expect(previousDay(4)).toBe(3)
    expect(addDays(7, 1)).toBe(1)
    expect(addDays(6, 3)).toBe(2)
    expect(addDays(3, 0)).toBe(3)
  })
})
