import { describe, expect, it } from 'vitest'
import {
  exceptionDateFilter,
  futureExceptions,
  resolveExceptions,
  toAdminExceptionEntries,
  toExceptionEntries,
  upcomingExceptions,
} from './exceptions'
import type { HoursExceptionEntry, HoursExceptionInput } from './types'

const TZ = 'Europe/Istanbul'
const istanbul = (iso: string) => new Date(`${iso}+03:00`)

const row = (overrides: Partial<HoursExceptionInput> = {}): HoursExceptionInput => ({
  id: 'a',
  date: new Date('2026-09-05T00:00:00.000Z'),
  isClosed: true,
  opensAt: null,
  closesAt: null,
  note: null,
  ...overrides,
})

const entry = (date: string): HoursExceptionEntry => ({
  date,
  isClosed: true,
  opensAt: null,
  closesAt: null,
  note: null,
})

describe('toExceptionEntries', () => {
  it('@db.Date değerini takvim gününe çevirir', () => {
    expect(toExceptionEntries([row()])[0]?.date).toBe('2026-09-05')
  })

  it('kapalı günde saatleri temizler', () => {
    const [result] = toExceptionEntries([
      row({ isClosed: true, opensAt: '10:00', closesAt: '14:00' }),
    ])
    expect(result).toMatchObject({ isClosed: true, opensAt: null, closesAt: null })
  })

  it('tarihe göre sıralar', () => {
    const rows = [
      row({ id: 'b', date: new Date('2026-09-10T00:00:00.000Z') }),
      row({ id: 'a', date: new Date('2026-09-03T00:00:00.000Z') }),
    ]
    expect(toExceptionEntries(rows).map((e) => e.date)).toEqual(['2026-09-03', '2026-09-10'])
  })

  it('panel listesi kimliği korur', () => {
    expect(toAdminExceptionEntries([row({ id: 'x' })])[0]?.id).toBe('x')
  })
})

describe('resolveExceptions', () => {
  const shop = [entry('2026-09-05')]
  const location = [entry('2026-09-10')]

  it('dükkanın kendi saatleri varsa kendi istisnaları geçerlidir', () => {
    expect(resolveExceptions('shop', shop, location)).toEqual(shop)
  })

  it('saatler devralınıyorsa mekanın istisnaları da devralınır', () => {
    expect(resolveExceptions('location', shop, location)).toEqual(location)
  })

  it('saat kaynağı yoksa istisna da yoktur', () => {
    expect(resolveExceptions('none', shop, location)).toEqual([])
    expect(resolveExceptions('location', shop, null)).toEqual([])
  })
})

describe('yaklaşan istisnalar', () => {
  const entries = [
    entry('2026-09-03'),
    entry('2026-09-04'),
    entry('2026-09-05'),
    entry('2026-09-09'),
  ]

  it('dünden itibaren gelenler taşınır (gece vardiyası dünün kaydına bakar)', () => {
    const result = upcomingExceptions(entries, istanbul('2026-09-05T12:00:00'), TZ)
    expect(result.map((e) => e.date)).toEqual(['2026-09-04', '2026-09-05', '2026-09-09'])
  })

  it('sitede yalnızca bugün ve sonrası listelenir', () => {
    const result = futureExceptions(entries, istanbul('2026-09-05T12:00:00'), TZ)
    expect(result.map((e) => e.date)).toEqual(['2026-09-05', '2026-09-09'])
  })

  it('gece yarısından sonra gün İstanbul saatine göre döner', () => {
    // 2026-09-05 22:00 UTC = 06.09 01:00 İstanbul → dün 05.09
    const result = futureExceptions(entries, new Date('2026-09-05T22:00:00Z'), TZ)
    expect(result.map((e) => e.date)).toEqual(['2026-09-09'])
  })
})

describe('exceptionDateFilter', () => {
  it('sorguyu dünkü tarihten başlatır', () => {
    const filter = exceptionDateFilter(istanbul('2026-09-05T12:00:00'), TZ)
    expect(filter.gte.toISOString()).toBe('2026-09-04T00:00:00.000Z')
  })
})
