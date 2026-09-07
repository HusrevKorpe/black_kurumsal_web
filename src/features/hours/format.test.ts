import { describe, expect, it } from 'vitest'
import { formatHoursEntry } from './format'
import type { HoursExceptionEntry } from './types'

describe('formatHoursEntry', () => {
  it('aralık, 24 saat ve kapalı durumlarını yazar', () => {
    expect(formatHoursEntry({ opensAt: '10:00', closesAt: '02:00', isClosed: false })).toBe(
      '10:00 – 02:00',
    )
    expect(formatHoursEntry({ opensAt: '00:00', closesAt: '00:00', isClosed: false })).toBe(
      '24 saat',
    )
    expect(formatHoursEntry({ opensAt: null, closesAt: null, isClosed: true })).toBe('Kapalı')
  })

  it('istisna gün kaydını da yazar (haftalık kayıtla aynı şekil)', () => {
    const exception: HoursExceptionEntry = {
      date: '2026-09-03',
      opensAt: null,
      closesAt: null,
      isClosed: true,
      note: 'Bayram',
    }
    expect(formatHoursEntry(exception)).toBe('Kapalı')
  })
})
