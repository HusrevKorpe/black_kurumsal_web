import { describe, expect, it } from 'vitest'
import { weeklyHoursSchema } from './schema'

const openDay = (dayOfWeek: number) => ({
  dayOfWeek,
  isClosed: false,
  opensAt: '10:00',
  closesAt: '02:00',
})
const week = (overrides: Partial<Record<number, object>> = {}) => ({
  useOwnHours: true,
  days: [1, 2, 3, 4, 5, 6, 7].map((d) => ({ ...openDay(d), ...(overrides[d] ?? {}) })),
})

describe('weeklyHoursSchema', () => {
  it('geçerli haftayı kabul eder', () => {
    expect(weeklyHoursSchema.safeParse(week()).success).toBe(true)
  })

  it('açık günde saat eksikse reddeder', () => {
    const result = weeklyHoursSchema.safeParse(week({ 3: { opensAt: null } }))
    expect(result.success).toBe(false)
  })

  it('kapalı günde saatler boş olabilir', () => {
    expect(
      weeklyHoursSchema.safeParse(week({ 7: { isClosed: true, opensAt: null, closesAt: null } }))
        .success,
    ).toBe(true)
  })

  it('7 günden az veya tekrarlı günü reddeder', () => {
    const w = week()
    expect(weeklyHoursSchema.safeParse({ ...w, days: w.days.slice(0, 6) }).success).toBe(false)
    const dup = week()
    dup.days[1] = openDay(1)
    expect(weeklyHoursSchema.safeParse(dup).success).toBe(false)
  })

  it('bozuk saat biçimini reddeder', () => {
    expect(weeklyHoursSchema.safeParse(week({ 1: { opensAt: '25:00' } })).success).toBe(false)
  })
})
