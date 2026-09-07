import { describe, expect, it } from 'vitest'
import { getOpenStatus } from './open-status'
import { normalizeWeek } from './resolve'
import type { HoursEntry } from './types'

const TZ = 'Europe/Istanbul'
/** İstanbul yerel saatiyle (UTC+3) bir an üretir. */
const istanbul = (iso: string) => new Date(`${iso}+03:00`)

const daily = (opensAt: string, closesAt: string): HoursEntry[] =>
  ([1, 2, 3, 4, 5, 6, 7] as const).map((dayOfWeek) => ({
    dayOfWeek,
    opensAt,
    closesAt,
    isClosed: false,
  }))

describe('getOpenStatus', () => {
  it('saat bilgisi yoksa bilinmiyor', () => {
    expect(getOpenStatus([], istanbul('2026-09-05T12:00:00'), TZ)).toEqual({ kind: 'unknown' })
  })

  it('normal gün içinde açık/kapalı', () => {
    const week = normalizeWeek(daily('09:00', '23:00'))
    expect(getOpenStatus(week, istanbul('2026-09-05T12:00:00'), TZ)).toEqual({
      kind: 'open',
      closesAt: '23:00',
    })
    expect(getOpenStatus(week, istanbul('2026-09-05T23:00:00'), TZ)).toMatchObject({
      kind: 'closed',
    })
    expect(getOpenStatus(week, istanbul('2026-09-05T08:59:00'), TZ)).toEqual({
      kind: 'closed',
      nextOpen: { dayOfWeek: 6, opensAt: '09:00' },
    })
  })

  it('gece yarısını geçen vardiya: 01:00 hâlâ açık, 03:00 kapalı', () => {
    const week = normalizeWeek(daily('10:00', '02:00'))
    expect(getOpenStatus(week, istanbul('2026-09-05T01:00:00'), TZ)).toEqual({
      kind: 'open',
      closesAt: '02:00',
    })
    expect(getOpenStatus(week, istanbul('2026-09-05T23:30:00'), TZ)).toEqual({
      kind: 'open',
      closesAt: '02:00',
    })
    expect(getOpenStatus(week, istanbul('2026-09-05T03:00:00'), TZ)).toEqual({
      kind: 'closed',
      nextOpen: { dayOfWeek: 6, opensAt: '10:00' },
    })
  })

  it('dün kapalıysa gece yarısından sonra açık sayılmaz', () => {
    const entries = daily('10:00', '02:00')
    entries[4] = { dayOfWeek: 5, opensAt: null, closesAt: null, isClosed: true } // Cuma kapalı
    const week = normalizeWeek(entries)
    // Cumartesi 01:00: Cuma vardiyası yok → kapalı, Cumartesi 10:00'da açılır
    expect(getOpenStatus(week, istanbul('2026-09-05T01:00:00'), TZ)).toEqual({
      kind: 'closed',
      nextOpen: { dayOfWeek: 6, opensAt: '10:00' },
    })
  })

  it('24 saat açık (açılış = kapanış)', () => {
    const week = normalizeWeek(daily('00:00', '00:00'))
    expect(getOpenStatus(week, istanbul('2026-09-05T04:00:00'), TZ)).toEqual({
      kind: 'open',
      closesAt: null,
    })
  })

  it('sonraki açılışı haftayı sararak bulur', () => {
    const week = normalizeWeek([
      { dayOfWeek: 1, opensAt: '09:00', closesAt: '18:00', isClosed: false },
    ])
    // Cumartesi → sonraki açılış Pazartesi
    expect(getOpenStatus(week, istanbul('2026-09-05T12:00:00'), TZ)).toEqual({
      kind: 'closed',
      nextOpen: { dayOfWeek: 1, opensAt: '09:00' },
    })
  })

  it('hiç açık gün yoksa nextOpen null', () => {
    const week = normalizeWeek([])
    expect(getOpenStatus(week, istanbul('2026-09-05T12:00:00'), TZ)).toEqual({
      kind: 'closed',
      nextOpen: null,
    })
  })
})
