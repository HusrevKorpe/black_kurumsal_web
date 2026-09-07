import 'server-only'
import type { Prisma } from '@/generated/prisma/client'
import { isOwner, type StaffContext } from '@/lib/auth/authorize'
import { db } from '@/lib/db'
import { campaignCardInclude, type CampaignCardData } from './queries'

function campaignAccessWhere(staff: StaffContext): Prisma.CampaignWhereInput {
  return isOwner(staff) ? {} : { scope: 'SHOP', shopId: { in: [...staff.shopIds] } }
}

/** Patron hepsini, sorumlu yalnızca kendi dükkanlarının kampanyalarını görür. */
export async function listCampaignsForStaff(staff: StaffContext): Promise<CampaignCardData[]> {
  return db.campaign.findMany({
    where: campaignAccessWhere(staff),
    orderBy: [{ isActive: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }],
    include: campaignCardInclude,
  })
}

export async function getCampaignForAdmin(
  staff: StaffContext,
  id: string,
): Promise<CampaignCardData | null> {
  return db.campaign.findFirst({
    where: { id, ...campaignAccessWhere(staff) },
    include: campaignCardInclude,
  })
}

export interface CampaignTargets {
  shops: { id: string; name: string }[]
  locations: { id: string; name: string }[]
}

export async function listCampaignTargets(staff: StaffContext): Promise<CampaignTargets> {
  const [shops, locations] = await Promise.all([
    db.shop.findMany({
      where: { ...(isOwner(staff) ? {} : { id: { in: [...staff.shopIds] } }), deletedAt: null },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true },
    }),
    isOwner(staff)
      ? db.location.findMany({
          where: { deletedAt: null },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ])
  return { shops, locations }
}
