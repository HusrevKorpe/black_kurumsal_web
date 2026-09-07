import { describe, expect, it } from 'vitest'
import { normalizeWeek, resolveHours } from './resolve'
import type { HoursEntry } from './types'

const open = (day: HoursEntry['dayOfWeek'], opensAt: string, closesAt: string): HoursEntry => ({
  dayOfWeek: day,
  opensAt,
  closesAt,
  isClosed: false,
})

describe('normalizeWeek', () => {
  it('eksik günleri kapalı olarak tamamlar ve sıralar', () => {
    const week = normalizeWeek([open(3, '10:00', '22:00'), open(1, '09:00', '18:00')])
    expect(week).toHaveLength(7)
    expect(week.map((e) => e.dayOfWeek)).toEqual([1, 2, 3, 4, 5, 6, 7])
    expect(week[0]).toEqual(open(1, '09:00', '18:00'))
    expect(week[1]).toEqual({ dayOfWeek: 2, opensAt: null, closesAt: null, isClosed: true })
  })

  it('kapalı günün saatlerini temizler', () => {
    const week = normalizeWeek([
      { dayOfWeek: 7, opensAt: '10:00', closesAt: '12:00', isClosed: true },
    ])
    expect(week[6]).toEqual({ dayOfWeek: 7, opensAt: null, closesAt: null, isClosed: true })
  })
})

describe('resolveHours', () => {
  const shop = [open(1, '10:00', '02:00')]
  const location = [open(1, '11:00', '23:30'), open(2, '11:00', '23:30')]

  it('dükkanın kendi kaydı varsa onu kullanır, mekanı yok sayar', () => {
    const result = resolveHours(shop, location)
    expect(result.source).toBe('shop')
    expect(result.week[0]).toEqual(open(1, '10:00', '02:00'))
    expect(result.week[1]?.isClosed).toBe(true)
  })

  it('dükkan kaydı yoksa mekanı devralır', () => {
    const result = resolveHours([], location)
    expect(result.source).toBe('location')
    expect(result.week[1]).toEqual(open(2, '11:00', '23:30'))
  })

  it('ikisi de yoksa bilinmiyor', () => {
    expect(resolveHours([], [])).toEqual({ source: 'none', week: [] })
    expect(resolveHours([], null)).toEqual({ source: 'none', week: [] })
  })
})
