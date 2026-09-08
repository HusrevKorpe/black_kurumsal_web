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

/**
 * Telefonda kısa yatay satır (küçük kare görsel + isim + durum), geniş ekranda 16:10 kapaklı kart.
 * 11 dükkan 16:10 kapakla alt alta 8 ekran uzuyordu; satır düzeniyle liste iki ekrana iner.
 */
export function ShopCard({ shop, hideLocation = false }: ShopCardProps) {
  const { week, source } = resolveHours(shop.hours, shop.location?.hours)
  const exceptions = resolveExceptions(
    source,
    toExceptionEntries(shop.hoursExceptions),
    shop.location ? toExceptionEntries(shop.location.hoursExceptions) : null,
  )
  const locationLabel = hideLocation ? '' : shopLocationLabel(shop.location)
  const typeLabel = SHOP_TYPE_META[shop.type].label

  return (
    <Link
      href={ROUTES.shop(shop.slug)}
      data-track="shop"
      className="group flex overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none sm:flex-col"
    >
      <div className="relative aspect-square w-24 shrink-0 overflow-hidden sm:aspect-[16/10] sm:w-auto">
        <CoverImage
          media={shop.coverImage}
          alt={shop.name}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 96px"
          className="transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute top-3 left-3 hidden sm:block">
          <Badge variant="secondary" className="shadow">
            {typeLabel}
          </Badge>
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 p-3 sm:justify-start sm:gap-1.5 sm:p-4">
        <h3 className="text-base leading-tight font-semibold sm:text-lg">{shop.name}</h3>
        {/* Telefonda rozet yok; tür bilgisi konumla aynı satırda yazıyla verilir. */}
        <p className="text-sm text-muted-foreground sm:hidden">
          {locationLabel ? `${typeLabel} · ${locationLabel}` : typeLabel}
        </p>
        {locationLabel ? (
          <p className="hidden text-sm text-muted-foreground sm:block">{locationLabel}</p>
        ) : null}
        <div className="pt-1 sm:mt-auto">
          <OpenStatusBadge week={week} exceptions={exceptions} />
        </div>
      </div>
    </Link>
  )
}
