import type { Prisma } from '@/generated/prisma/client'

export interface CampaignWindow {
  isActive: boolean
  startsAt: Date | null
  endsAt: Date | null
}

/** Aktif ve tarih penceresi içinde mi? Tarih yoksa sınırsız. */
export function isCampaignActive(campaign: CampaignWindow, now: Date = new Date()): boolean {
  if (!campaign.isActive) return false
  if (campaign.startsAt && campaign.startsAt.getTime() > now.getTime()) return false
  if (campaign.endsAt && campaign.endsAt.getTime() < now.getTime()) return false
  return true
}

/** Aynı kuralın Prisma filtresi. */
export function activeCampaignWhere(now: Date = new Date()): Prisma.CampaignWhereInput {
  return {
    isActive: true,
    AND: [
      { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
      { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
    ],
  }
}
