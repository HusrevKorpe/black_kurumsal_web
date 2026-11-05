import Image from 'next/image'
import Link from 'next/link'
import { resolveExceptions, resolveHours, toExceptionEntries } from '@/features/hours'
import type { ShopCardData } from '@/features/shops/queries'
import { shopLocationLabel } from '@/features/shops/view'
import { ROUTES } from '@/lib/constants/routes'
import { SHOP_TYPE_META } from '@/lib/constants/shops'
import { mediaPublicUrl } from '@/lib/media/url'
import { OpenStatusBadge } from './open-status-badge'
import { ShopCoverMorph, ShopNameMorph } from './shop-morph'
import { DisplayName } from './display-name'

interface ShopRowProps {
  shop: ShopCardData
  /** Mekan sayfasında konum bilgisi gereksizdir. */
  hideLocation?: boolean
}

/**
 * Bir tabela: telefonda en az 72 px'lik satır, geniş ekranda dev ad. Fotoğraf telefonda satırın
 * sağındaki şerit, geniş ekranda listenin yanındaki büyük pano olur (`.shop-directory`, globals.css).
 */
export function ShopRow({ shop, hideLocation = false }: ShopRowProps) {
  const { week, source } = resolveHours(shop.hours, shop.location?.hours)
  const exceptions = resolveExceptions(
    source,
    toExceptionEntries(shop.hoursExceptions),
    shop.location ? toExceptionEntries(shop.location.hoursExceptions) : null,
  )
  const locationLabel = hideLocation ? '' : shopLocationLabel(shop.location)
  const typeLabel = SHOP_TYPE_META[shop.type].label

  return (
    <li
      className="shop-row border-t border-border last:border-b"
      data-accent={SHOP_TYPE_META[shop.type].accent}
    >
      <Link
        href={ROUTES.shop(shop.slug)}
        data-track="shop"
        className="shop-row-link relative flex min-h-[4.5rem] items-center py-2 pr-24 transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring active:bg-accent lg:min-h-28 lg:pr-4"
      >
        <div className="relative z-10 min-w-0">
          <ShopNameMorph slug={shop.slug}>
            <h3 className="shop-row-name w-fit max-w-full font-display text-2xl leading-[1.05] font-bold uppercase transition-colors lg:text-5xl">
              <DisplayName>{shop.name}</DisplayName>
            </h3>
          </ShopNameMorph>
          <p className="mt-0.5 flex items-center gap-x-2 text-sm text-muted-foreground lg:mt-2">
            <OpenStatusBadge week={week} exceptions={exceptions} className="shrink-0 text-xs" />
            <span className="min-w-0 truncate">
              {locationLabel ? `${typeLabel} · ${locationLabel}` : typeLabel}
            </span>
          </p>
        </div>
        {/* Yalnız gerçek fotoğraf dükkan sayfasının kapağına akar; yazılı pano akmaz. */}
        {shop.coverImage ? (
          <ShopCoverMorph slug={shop.slug}>
            <div className="shop-row-photo" aria-hidden>
              <Image
                src={mediaPublicUrl(shop.coverImage)}
                alt=""
                fill
                sizes="(min-width: 1024px) 44vw, 88px"
                className="object-cover"
              />
            </div>
          </ShopCoverMorph>
        ) : (
          <div className="shop-row-photo" aria-hidden>
            <div className="shop-row-plate font-display font-bold uppercase">{typeLabel}</div>
          </div>
        )}
      </Link>
    </li>
  )
}
