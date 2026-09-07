import { describe, expect, it } from 'vitest'
import { formatHoursEntry } from './format'

describe('formatHoursEntry', () => {
  it('aralık, 24 saat ve kapalı durumlarını yazar', () => {
    expect(
      formatHoursEntry({ dayOfWeek: 1, opensAt: '10:00', closesAt: '02:00', isClosed: false }),
    ).toBe('10:00 – 02:00')
    expect(
      formatHoursEntry({ dayOfWeek: 1, opensAt: '00:00', closesAt: '00:00', isClosed: false }),
    ).toBe('24 saat')
    expect(formatHoursEntry({ dayOfWeek: 1, opensAt: null, closesAt: null, isClosed: true })).toBe(
      'Kapalı',
    )
  })
})
