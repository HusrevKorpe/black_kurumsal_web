import { describe, expect, it } from 'vitest'
import { campaignStatus } from './status'

const now = new Date('2026-09-05T12:00:00Z')
const day = 86_400_000

describe('campaignStatus', () => {
  it('durumları ayırır', () => {
    expect(campaignStatus({ isActive: false, startsAt: null, endsAt: null }, now)).toBe('inactive')
    expect(
      campaignStatus(
        { isActive: true, startsAt: null, endsAt: new Date(now.getTime() - day) },
        now,
      ),
    ).toBe('expired')
    expect(
      campaignStatus(
        { isActive: true, startsAt: new Date(now.getTime() + day), endsAt: null },
        now,
      ),
    ).toBe('scheduled')
    expect(campaignStatus({ isActive: true, startsAt: null, endsAt: null }, now)).toBe('live')
  })
})
