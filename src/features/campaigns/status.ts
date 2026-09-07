import type { CampaignWindow } from './active'

export type CampaignStatus = 'live' | 'scheduled' | 'expired' | 'inactive'

/** Paneldeki durum rozeti: pasif > süresi dolmuş > planlanmış > yayında. */
export function campaignStatus(campaign: CampaignWindow, now: Date = new Date()): CampaignStatus {
  if (!campaign.isActive) return 'inactive'
  if (campaign.endsAt && campaign.endsAt.getTime() < now.getTime()) return 'expired'
  if (campaign.startsAt && campaign.startsAt.getTime() > now.getTime()) return 'scheduled'
  return 'live'
}
