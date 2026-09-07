import 'server-only'
import type { Prisma } from '@/generated/prisma/client'
import { db } from '@/lib/db'
import { activeCampaignWhere } from './active'

export const campaignCardInclude = {
  image: true,
  shop: { select: { slug: true, name: true } },
  location: { select: { slug: true, name: true } },
} satisfies Prisma.CampaignInclude

export type CampaignCardData = Prisma.CampaignGetPayload<{ include: typeof campaignCardInclude }>

/** Yayındaki kampanyalar; ana sayfa ve kampanyalar sayfası. */
export async function getActiveCampaigns(
  now: Date = new Date(),
  take?: number,
): Promise<CampaignCardData[]> {
  return db.campaign.findMany({
    where: activeCampaignWhere(now),
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    include: campaignCardInclude,
    take,
  })
}
