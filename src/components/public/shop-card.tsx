import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { resolveExceptions, resolveHours, toExceptionEntries } from '@/features/hours'
import type { ShopCardData } from '@/features/shops/queries'
import { shopLocationLabel } from '@/features/shops/view'
import { ROUTES } from '@/lib/constants/routes'
import { SHOP_TYPE_META } from '@/lib/constants/shops'
import { CoverImage } from './cover-image'
import { OpenStatusBadge } from './open-status-badge'

interface ShopCardProps {
  shop: ShopCardData
  /** Mekan sayfasında konum satırı gereksizdir. */
  hideLocation?: boolean
}

export function ShopCard({ shop, hideLocation = false }: ShopCardProps) {
  const { week, source } = resolveHours(shop.hours, shop.location?.hours)
  const exceptions = resolveExceptions(
    source,
    toExceptionEntries(shop.hoursExceptions),
    shop.location ? toExceptionEntries(shop.location.hoursExceptions) : null,
  )
  const locationLabel = hideLocation ? '' : shopLocationLabel(shop.location)

  return (
    <Link
      href={ROUTES.shop(shop.slug)}
      className="group flex flex-col overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <div className="relative aspect-[16/10] overflow-hidden">
        <CoverImage
          media={shop.coverImage}
          alt={shop.name}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <Badge variant="secondary" className="absolute top-3 left-3 shadow">
          {SHOP_TYPE_META[shop.type].label}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="text-base leading-tight font-semibold sm:text-lg">{shop.name}</h3>
        {locationLabel ? <p className="text-sm text-muted-foreground">{locationLabel}</p> : null}
        <div className="mt-auto pt-1">
          <OpenStatusBadge week={week} exceptions={exceptions} />
        </div>
      </div>
    </Link>
  )
}
