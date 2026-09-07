import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { ShopDangerZone } from '@/components/admin/shops/shop-danger-zone'
import { ShopForm } from '@/components/admin/shops/shop-form'
import { getShopForAdmin, listLocationOptions } from '@/features/shops/admin-queries'
import { isOwner } from '@/lib/auth/authorize'
import { requireStaff } from '@/lib/auth/session'
import { tr } from '@/lib/i18n/tr'

export const metadata: Metadata = { title: tr.admin.shops.tabs.info, robots: { index: false } }

export default async function ShopInfoPage({ params }: PageProps<'/admin/dukkanlar/[id]'>) {
  const { id } = await params
  const staff = await requireStaff()
  const [shop, locations] = await Promise.all([getShopForAdmin(staff, id), listLocationOptions()])
  if (!shop) notFound()
  const owner = isOwner(staff)

  return (
    <div className="space-y-10">
      <ShopForm mode="edit" shop={shop} locations={locations} isOwner={owner} />
      {owner ? <ShopDangerZone shopId={shop.id} shopName={shop.name} /> : null}
    </div>
  )
}
