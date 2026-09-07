import { ExternalLinkIcon } from 'lucide-react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PageHeader } from '@/components/admin/page-header'
import { ShopTabs } from '@/components/admin/shops/shop-tabs'
import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { getShopForAdmin } from '@/features/shops/admin-queries'
import { requireStaff } from '@/lib/auth/session'
import { ROUTES } from '@/lib/constants/routes'
import { SHOP_TYPE_META } from '@/lib/constants/shops'
import { tr } from '@/lib/i18n/tr'

export default async function ShopAdminLayout({
  children,
  params,
}: LayoutProps<'/admin/dukkanlar/[id]'>) {
  const { id } = await params
  const staff = await requireStaff()
  const shop = await getShopForAdmin(staff, id)
  if (!shop) notFound()

  return (
    <div className="mx-auto w-full max-w-4xl">
      <PageHeader
        title={shop.name}
        breadcrumb={
          <Link href={ROUTES.admin.shops} className="hover:text-foreground">
            ← {tr.admin.shops.title}
          </Link>
        }
        description={`${SHOP_TYPE_META[shop.type].label}${shop.location ? ` · ${shop.location.name}` : ''}`}
        actions={
          <>
            {!shop.isActive ? <Badge variant="outline">{tr.common.inactive}</Badge> : null}
            <Link
              href={ROUTES.shop(shop.slug)}
              target="_blank"
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
            >
              <ExternalLinkIcon data-icon="inline-start" /> {tr.admin.shops.viewOnSite}
            </Link>
          </>
        }
      />
      <ShopTabs shopId={shop.id} />
      <div className="mt-6">{children}</div>
    </div>
  )
}
