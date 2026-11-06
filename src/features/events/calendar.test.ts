import { describe, expect, it } from 'vitest'
import { addMonths, dayKey, eventDayKeys, groupByDay, monthGrid, monthOf } from './calendar'

describe('takvim', () => {
  it('gün anahtarı İstanbul saatine göre', () => {
    // UTC 22:30 = İstanbul 01:30, ertesi gün.
    expect(dayKey(new Date('2026-11-06T22:30:00Z'))).toBe('2026-11-07')
    expect(monthOf(new Date('2026-11-30T21:30:00Z'))).toEqual({ year: 2026, month: 12 })
  })

  it('ay ızgarası pazartesiyle başlar, tam haftadır', () => {
    // 1 Kasım 2026 pazar.
    const cells = monthGrid({ year: 2026, month: 11 })
    expect(cells).toHaveLength(42)
    expect(cells[0]).toMatchObject({ key: '2026-10-26', inMonth: false, weekday: 0 })
    expect(cells[6]).toMatchObject({ key: '2026-11-01', day: 1, inMonth: true, weekday: 6 })
    expect(cells.filter((c) => c.inMonth)).toHaveLength(30)
    // Şubat 2027 pazartesi başlar, 4 hafta.
    expect(monthGrid({ year: 2027, month: 2 })).toHaveLength(28)
  })

  it('ay ekleme yıl atlar', () => {
    expect(addMonths({ year: 2026, month: 12 }, 1)).toEqual({ year: 2027, month: 1 })
    expect(addMonths({ year: 2026, month: 1 }, -1)).toEqual({ year: 2025, month: 12 })
  })

  it('çok günlü etkinlik her güne yazılır', () => {
    expect(
      eventDayKeys(new Date('2026-11-06T17:00:00Z'), new Date('2026-11-08T20:00:00Z')),
    ).toEqual(['2026-11-06', '2026-11-07', '2026-11-08'])
    const map = groupByDay([
      { id: 'b', startsAt: '2026-11-07T18:00:00Z', endsAt: null },
      { id: 'a', startsAt: '2026-11-06T17:00:00Z', endsAt: '2026-11-07T20:00:00Z' },
    ])
    expect(map.get('2026-11-07')?.map((e) => e.id)).toEqual(['a', 'b'])
  })
})
