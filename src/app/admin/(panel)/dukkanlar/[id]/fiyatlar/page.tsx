import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { PriceEditor } from '@/components/admin/pricing/price-editor'
import { toPriceCategoryViews } from '@/features/pricing/view'
import { getShopForAdmin, getShopPricingForAdmin } from '@/features/shops/admin-queries'
import { requireStaff } from '@/lib/auth/session'
import { SHOP_TYPE_META } from '@/lib/constants/shops'
import { tr } from '@/lib/i18n/tr'

export const metadata: Metadata = { title: tr.admin.pricing.title, robots: { index: false } }

export default async function ShopPricingPage({
  params,
}: PageProps<'/admin/dukkanlar/[id]/fiyatlar'>) {
  const { id } = await params
  const staff = await requireStaff()
  const shop = await getShopForAdmin(staff, id)
  if (!shop) notFound()
  const categories = toPriceCategoryViews(await getShopPricingForAdmin(staff, shop.id))

  return (
    <PriceEditor
      shopId={shop.id}
      categories={categories}
      defaultUnit={SHOP_TYPE_META[shop.type].defaultUnit}
    />
  )
}
