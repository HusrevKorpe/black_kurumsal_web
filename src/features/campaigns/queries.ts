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

/**
 * Yayındaki kampanyalar; ana sayfa ve kampanyalar sayfası. Silinen ya da yayından kalkan dükkan/mekanın
 * kampanyası listelenmez: kartı 404'e giden bir bağlantı gösterirdi.
 */
export async function getActiveCampaigns(
  now: Date = new Date(),
  take?: number,
): Promise<CampaignCardData[]> {
  return db.campaign.findMany({
    where: {
      AND: [
        activeCampaignWhere(now),
        // Hedefi olmayan (GLOBAL) kampanya elenmesin: yalnızca hedefi silinmişse düşer.
        { OR: [{ shopId: null }, { shop: { deletedAt: null, isActive: true } }] },
        { OR: [{ locationId: null }, { location: { deletedAt: null, isActive: true } }] },
      ],
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    include: campaignCardInclude,
    take,
  })
}
