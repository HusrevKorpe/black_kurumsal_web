import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/page-header'
import { ShopForm } from '@/components/admin/shops/shop-form'
import { listLocationOptions } from '@/features/shops/admin-queries'
import { requireOwner } from '@/lib/auth/session'
import { tr } from '@/lib/i18n/tr'

export const metadata: Metadata = { title: tr.admin.shops.createTitle, robots: { index: false } }

export default async function NewShopPage() {
  await requireOwner()
  const locations = await listLocationOptions()
  return (
    <div className="mx-auto w-full max-w-3xl">
      <PageHeader title={tr.admin.shops.createTitle} />
      <ShopForm mode="create" locations={locations} isOwner />
    </div>
  )
}
