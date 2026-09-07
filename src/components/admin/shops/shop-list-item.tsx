import { ChevronRightIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import type { AdminShopListItem } from '@/features/shops/admin-queries'
import { SHOP_TYPE_META } from '@/lib/constants/shops'
import { tr } from '@/lib/i18n/tr'
import { mediaPublicUrl } from '@/lib/media/url'

interface ShopListItemProps {
  shop: AdminShopListItem
  href: `/${string}`
}

export function ShopListItem({ shop, href }: ShopListItemProps) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center gap-3 rounded-xl border bg-card p-3 transition-colors hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <div className="relative size-16 shrink-0 overflow-hidden rounded-lg bg-muted">
          {shop.coverImage ? (
            <Image
              src={mediaPublicUrl(shop.coverImage)}
              alt=""
              fill
              sizes="64px"
              className="object-cover"
            />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium">{shop.name}</p>
            {!shop.isActive ? <Badge variant="outline">{tr.common.inactive}</Badge> : null}
          </div>
          <p className="truncate text-xs text-muted-foreground">
            {SHOP_TYPE_META[shop.type].label}
            {shop.location ? ` · ${shop.location.name}` : ''}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {tr.admin.shops.counts(shop._count.gallery, shop._count.priceCategories)}
          </p>
        </div>
        <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground" />
      </Link>
    </li>
  )
}
