import { describe, expect, it } from 'vitest'
import { campaignFormSchema } from './schema'

const base = {
  title: 'Turnuva',
  description: '',
  imageId: 'm1',
  scope: 'GLOBAL',
  shopId: null,
  locationId: null,
  ctaLabel: '',
  ctaUrl: '',
  startsAt: '',
  endsAt: '',
  isActive: true,
  sortOrder: 0,
}

describe('campaignFormSchema', () => {
  it('genel kampanyayı kabul eder ve boşları null yapar', () => {
    const c = campaignFormSchema.parse(base)
    expect(c.description).toBeNull()
    expect(c.ctaUrl).toBeNull()
    expect(c.startsAt).toBeNull()
  })

  it('kapsam ile hedef uyumsuzsa reddeder', () => {
    expect(campaignFormSchema.safeParse({ ...base, scope: 'SHOP' }).success).toBe(false)
    expect(campaignFormSchema.safeParse({ ...base, scope: 'SHOP', shopId: 's1' }).success).toBe(
      true,
    )
    expect(campaignFormSchema.safeParse({ ...base, scope: 'GLOBAL', shopId: 's1' }).success).toBe(
      false,
    )
    expect(
      campaignFormSchema.safeParse({ ...base, scope: 'LOCATION', locationId: 'l1' }).success,
    ).toBe(true)
  })

  it('tarihleri çözer ve sırayı denetler', () => {
    const ok = campaignFormSchema.parse({
      ...base,
      startsAt: '2026-09-01T00:00:00.000Z',
      endsAt: '2026-09-30T00:00:00.000Z',
    })
    expect(ok.startsAt).toBeInstanceOf(Date)
    expect(
      campaignFormSchema.safeParse({
        ...base,
        startsAt: '2026-09-30T00:00:00.000Z',
        endsAt: '2026-09-01T00:00:00.000Z',
      }).success,
    ).toBe(false)
  })

  it('görsel zorunlu', () => {
    expect(campaignFormSchema.safeParse({ ...base, imageId: '' }).success).toBe(false)
  })
})
