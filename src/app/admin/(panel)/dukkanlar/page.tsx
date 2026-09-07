import { PlusIcon } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/admin/page-header'
import { ShopListItem } from '@/components/admin/shops/shop-list-item'
import { buttonVariants } from '@/components/ui/button'
import { listShopsForStaff } from '@/features/shops/admin-queries'
import { requireStaff } from '@/lib/auth/session'
import { isOwner } from '@/lib/auth/authorize'
import { ROUTES } from '@/lib/constants/routes'
import { tr } from '@/lib/i18n/tr'

export const metadata: Metadata = { title: tr.admin.shops.title, robots: { index: false } }

export default async function AdminShopsPage() {
  const staff = await requireStaff()
  const shops = await listShopsForStaff(staff)
  const owner = isOwner(staff)

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader
        title={tr.admin.shops.title}
        description={tr.home.shopCount(shops.length)}
        actions={
          owner ? (
            <Link href="/admin/dukkanlar/yeni" className={buttonVariants()}>
              <PlusIcon data-icon="inline-start" /> {tr.admin.shops.newShop}
            </Link>
          ) : null
        }
      />
      {shops.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          {owner ? tr.admin.shops.empty : tr.admin.shops.noAccess}
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {shops.map((shop) => (
            <ShopListItem key={shop.id} shop={shop} href={ROUTES.admin.shop(shop.id)} />
          ))}
        </ul>
      )}
    </div>
  )
}
