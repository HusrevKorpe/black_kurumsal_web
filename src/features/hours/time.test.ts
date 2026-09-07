import { describe, expect, it } from 'vitest'
import {
  addDays,
  addDaysToKey,
  dateKeyFromDbDate,
  dbDateFromKey,
  formatHm,
  formatDateKey,
  parseHm,
  previousDay,
  zonedNow,
} from './time'

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
    expect(zonedNow(at, 'Europe/Istanbul')).toEqual({
      dayOfWeek: 6,
      minutes: 90,
      dateKey: '2026-09-05',
    })
  })

  it('Pazar gününü 7 olarak verir', () => {
    const at = new Date('2026-09-06T09:00:00Z') // Pazar 12:00 İstanbul
    expect(zonedNow(at, 'Europe/Istanbul')).toEqual({
      dayOfWeek: 7,
      minutes: 720,
      dateKey: '2026-09-06',
    })
  })

  it('takvim günü UTC değil, saat dilimine göre belirlenir', () => {
    // 21:30 UTC = ertesi gün 00:30 İstanbul: gün değişmiş olmalı
    const at = new Date('2026-09-05T21:30:00Z')
    expect(zonedNow(at, 'Europe/Istanbul').dateKey).toBe('2026-09-06')
    expect(zonedNow(at, 'UTC').dateKey).toBe('2026-09-05')
  })
})

describe('takvim günü anahtarları', () => {
  it('gün ekler ve ay/yıl sınırını sarar', () => {
    expect(addDaysToKey('2026-09-05', 1)).toBe('2026-09-06')
    expect(addDaysToKey('2026-09-01', -1)).toBe('2026-08-31')
    expect(addDaysToKey('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDaysToKey('2028-02-28', 1)).toBe('2028-02-29') // artık yıl
  })

  it('Date ile anahtar arasında kayıpsız gidip gelir', () => {
    const date = dbDateFromKey('2026-09-05')
    expect(date).not.toBeNull()
    expect(dateKeyFromDbDate(date as Date)).toBe('2026-09-05')
  })

  it('olmayan tarihi reddeder', () => {
    expect(dbDateFromKey('2026-02-31')).toBeNull()
    expect(dbDateFromKey('05.09.2026')).toBeNull()
    expect(dbDateFromKey('2026-9-5')).toBeNull()
  })

  it('tarihi Türkçe yazar', () => {
    expect(formatDateKey('2026-09-05')).toContain('Eylül')
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
