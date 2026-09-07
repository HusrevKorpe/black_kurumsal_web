import { describe, expect, it } from 'vitest'
import { isCampaignActive } from './active'

const now = new Date('2026-09-05T12:00:00Z')
const day = 24 * 60 * 60 * 1000

describe('isCampaignActive', () => {
  it('pasif kampanya asla aktif değildir', () => {
    expect(isCampaignActive({ isActive: false, startsAt: null, endsAt: null }, now)).toBe(false)
  })

  it('tarihsiz aktif kampanya sınırsızdır', () => {
    expect(isCampaignActive({ isActive: true, startsAt: null, endsAt: null }, now)).toBe(true)
  })

  it('başlangıç gelecekteyse henüz aktif değil', () => {
    expect(
      isCampaignActive(
        { isActive: true, startsAt: new Date(now.getTime() + day), endsAt: null },
        now,
      ),
    ).toBe(false)
  })

  it('bitiş geçmişteyse aktif değil, tam sınırda aktif', () => {
    expect(
      isCampaignActive(
        { isActive: true, startsAt: null, endsAt: new Date(now.getTime() - 1) },
        now,
      ),
    ).toBe(false)
    expect(isCampaignActive({ isActive: true, startsAt: null, endsAt: now }, now)).toBe(true)
  })

  it('pencere içinde aktif', () => {
    expect(
      isCampaignActive(
        {
          isActive: true,
          startsAt: new Date(now.getTime() - day),
          endsAt: new Date(now.getTime() + day),
        },
        now,
      ),
    ).toBe(true)
  })
})
