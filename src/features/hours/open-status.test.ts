import { describe, expect, it } from 'vitest'
import { getOpenStatus } from './open-status'
import { normalizeWeek } from './resolve'
import type { HoursEntry, HoursExceptionEntry } from './types'

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

const closedOn = (date: string, note: string | null = null): HoursExceptionEntry => ({
  date,
  isClosed: true,
  opensAt: null,
  closesAt: null,
  note,
})

describe('getOpenStatus', () => {
  it('saat bilgisi yoksa bilinmiyor', () => {
    expect(getOpenStatus([], { now: istanbul('2026-09-05T12:00:00'), timeZone: TZ })).toEqual({
      kind: 'unknown',
    })
  })

  it('normal gün içinde açık/kapalı', () => {
    const week = normalizeWeek(daily('09:00', '23:00'))
    expect(getOpenStatus(week, { now: istanbul('2026-09-05T12:00:00'), timeZone: TZ })).toEqual({
      kind: 'open',
      closesAt: '23:00',
    })
    expect(
      getOpenStatus(week, { now: istanbul('2026-09-05T23:00:00'), timeZone: TZ }),
    ).toMatchObject({ kind: 'closed' })
    expect(getOpenStatus(week, { now: istanbul('2026-09-05T08:59:00'), timeZone: TZ })).toEqual({
      kind: 'closed',
      nextOpen: { dayOfWeek: 6, opensAt: '09:00' },
    })
  })

  it('gece yarısını geçen vardiya: 01:00 hâlâ açık, 03:00 kapalı', () => {
    const week = normalizeWeek(daily('10:00', '02:00'))
    expect(getOpenStatus(week, { now: istanbul('2026-09-05T01:00:00'), timeZone: TZ })).toEqual({
      kind: 'open',
      closesAt: '02:00',
    })
    expect(getOpenStatus(week, { now: istanbul('2026-09-05T23:30:00'), timeZone: TZ })).toEqual({
      kind: 'open',
      closesAt: '02:00',
    })
    expect(getOpenStatus(week, { now: istanbul('2026-09-05T03:00:00'), timeZone: TZ })).toEqual({
      kind: 'closed',
      nextOpen: { dayOfWeek: 6, opensAt: '10:00' },
    })
  })

  it('dün kapalıysa gece yarısından sonra açık sayılmaz', () => {
    const entries = daily('10:00', '02:00')
    entries[4] = { dayOfWeek: 5, opensAt: null, closesAt: null, isClosed: true } // Cuma kapalı
    const week = normalizeWeek(entries)
    // Cumartesi 01:00: Cuma vardiyası yok → kapalı, Cumartesi 10:00'da açılır
    expect(getOpenStatus(week, { now: istanbul('2026-09-05T01:00:00'), timeZone: TZ })).toEqual({
      kind: 'closed',
      nextOpen: { dayOfWeek: 6, opensAt: '10:00' },
    })
  })

  it('24 saat açık (açılış = kapanış)', () => {
    const week = normalizeWeek(daily('00:00', '00:00'))
    expect(getOpenStatus(week, { now: istanbul('2026-09-05T04:00:00'), timeZone: TZ })).toEqual({
      kind: 'open',
      closesAt: null,
    })
  })

  it('sonraki açılışı haftayı sararak bulur', () => {
    const week = normalizeWeek([
      { dayOfWeek: 1, opensAt: '09:00', closesAt: '18:00', isClosed: false },
    ])
    // Cumartesi → sonraki açılış Pazartesi
    expect(getOpenStatus(week, { now: istanbul('2026-09-05T12:00:00'), timeZone: TZ })).toEqual({
      kind: 'closed',
      nextOpen: { dayOfWeek: 1, opensAt: '09:00' },
    })
  })

  it('hiç açık gün yoksa nextOpen null', () => {
    const week = normalizeWeek([])
    expect(getOpenStatus(week, { now: istanbul('2026-09-05T12:00:00'), timeZone: TZ })).toEqual({
      kind: 'closed',
      nextOpen: null,
    })
  })
})

describe('getOpenStatus — istisna günler', () => {
  const week = normalizeWeek(daily('09:00', '23:00'))

  it('kapalı istisna haftalık tabloyu ezer', () => {
    expect(
      getOpenStatus(week, {
        now: istanbul('2026-09-05T12:00:00'),
        timeZone: TZ,
        exceptions: [closedOn('2026-09-05', 'Bayram')],
      }),
    ).toEqual({ kind: 'closed', nextOpen: { dayOfWeek: 7, opensAt: '09:00' } })
  })

  it('başka güne ait istisna bugünü etkilemez', () => {
    expect(
      getOpenStatus(week, {
        now: istanbul('2026-09-05T12:00:00'),
        timeZone: TZ,
        exceptions: [closedOn('2026-09-06')],
      }),
    ).toEqual({ kind: 'open', closesAt: '23:00' })
  })

  it('yarım gün istisnası saatleri değiştirir', () => {
    const halfDay: HoursExceptionEntry = {
      date: '2026-09-05',
      isClosed: false,
      opensAt: '09:00',
      closesAt: '14:00',
      note: 'Yarım gün',
    }
    expect(
      getOpenStatus(week, {
        now: istanbul('2026-09-05T12:00:00'),
        timeZone: TZ,
        exceptions: [halfDay],
      }),
    ).toEqual({ kind: 'open', closesAt: '14:00' })
    expect(
      getOpenStatus(week, {
        now: istanbul('2026-09-05T15:00:00'),
        timeZone: TZ,
        exceptions: [halfDay],
      }),
    ).toEqual({ kind: 'closed', nextOpen: { dayOfWeek: 7, opensAt: '09:00' } })
  })

  it('sonraki açılış, araya giren kapalı istisnayı atlar', () => {
    // Cumartesi 23:30 kapalı; Pazar da istisnayla kapalı → Pazartesi 09:00
    expect(
      getOpenStatus(week, {
        now: istanbul('2026-09-05T23:30:00'),
        timeZone: TZ,
        exceptions: [closedOn('2026-09-06')],
      }),
    ).toEqual({ kind: 'closed', nextOpen: { dayOfWeek: 1, opensAt: '09:00' } })
  })

  it('dünün gece vardiyası istisnayla kapatılmışsa 01:00 kapalıdır', () => {
    const overnight = normalizeWeek(daily('10:00', '02:00'))
    // Cumartesi 01:00 normalde Cuma vardiyasıyla açık; Cuma istisnayla kapalı → kapalı
    expect(
      getOpenStatus(overnight, {
        now: istanbul('2026-09-05T01:00:00'),
        timeZone: TZ,
        exceptions: [closedOn('2026-09-04')],
      }),
    ).toEqual({ kind: 'closed', nextOpen: { dayOfWeek: 6, opensAt: '10:00' } })
  })

  it('geçmiş istisna kaydı hiçbir şeyi değiştirmez', () => {
    expect(
      getOpenStatus(week, {
        now: istanbul('2026-09-05T12:00:00'),
        timeZone: TZ,
        exceptions: [closedOn('2025-09-05')],
      }),
    ).toEqual({ kind: 'open', closesAt: '23:00' })
  })
})
