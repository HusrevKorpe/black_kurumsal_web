import 'server-only'
import { activeCampaignWhere } from '@/features/campaigns/active'
import { accessibleShopFilter, isOwner, type StaffContext } from '@/lib/auth/authorize'
import { db } from '@/lib/db'

export interface DashboardData {
  shopsTotal: number
  shopsActive: number
  liveCampaigns: number
  galleryImages: number
  shops: { id: string; name: string; isActive: boolean }[]
}

/** Patron tüm siteyi, sorumlu yalnızca kendi dükkanlarını sayar. */
export async function getDashboardData(staff: StaffContext): Promise<DashboardData> {
  const shopWhere = { ...accessibleShopFilter(staff), deletedAt: null }
  const shopIds = isOwner(staff) ? undefined : [...staff.shopIds]
  const [shopsTotal, shopsActive, liveCampaigns, galleryImages, shops] = await Promise.all([
    db.shop.count({ where: shopWhere }),
    db.shop.count({ where: { ...shopWhere, isActive: true } }),
    db.campaign.count({
      where: {
        ...activeCampaignWhere(),
        ...(shopIds ? { scope: 'SHOP', shopId: { in: shopIds } } : {}),
      },
    }),
    db.galleryImage.count({ where: shopIds ? { shopId: { in: shopIds } } : {} }),
    db.shop.findMany({
      where: shopWhere,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { id: true, name: true, isActive: true },
      take: 12,
    }),
  ])
  return { shopsTotal, shopsActive, liveCampaigns, galleryImages, shops }
}
