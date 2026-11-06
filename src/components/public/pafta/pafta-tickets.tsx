import Image from 'next/image'
import Link from 'next/link'
import { resolveExceptions, resolveHours, toExceptionEntries } from '@/features/hours'
import type { ShopCardData } from '@/features/shops/queries'
import { shopLocationLabel } from '@/features/shops/view'
import { ROUTES } from '@/lib/constants/routes'
import { SHOP_TYPE_META } from '@/lib/constants/shops'
import { mediaPublicUrl } from '@/lib/media/url'
import { coverFocusStyle } from '../cover-image'
import { DisplayName } from '../display-name'
import { isUnderRenovation } from '@/features/shops/renovation'
import { RenovationBadge } from '../renovation-badge'
import { OpenStatusBadge } from '../open-status-badge'
import { ShopCoverMorph, ShopNameMorph } from '../shop-morph'
import { ShopTypeIcon } from '../shop-type-icon'
import { ticketNumber } from './ticket-number'

function ShopTicket({
  shop,
  index,
  total,
  hideLocation,
}: {
  shop: ShopCardData
  index: number
  total: number
  hideLocation: boolean
}) {
  const meta = SHOP_TYPE_META[shop.type]
  const { week, source } = resolveHours(shop.hours, shop.location?.hours)
  const exceptions = resolveExceptions(
    source,
    toExceptionEntries(shop.hoursExceptions),
    shop.location ? toExceptionEntries(shop.location.hoursExceptions) : null,
  )
  const locationLabel = hideLocation ? '' : shopLocationLabel(shop.location)

  return (
    <li data-accent={meta.accent}>
      <Link href={ROUTES.shop(shop.slug)} data-track="shop" className="pafta-ticket">
        <span className="pafta-badge" aria-hidden>
          {shop.coverImage ? (
            // Yalnız gerçek fotoğraf dükkan sayfasının kapağına büyüyerek akar.
            <ShopCoverMorph slug={shop.slug}>
              <span className="absolute inset-0">
                <Image
                  src={mediaPublicUrl(shop.coverImage)}
                  alt=""
                  fill
                  sizes="76px"
                  className="object-cover"
                  style={coverFocusStyle(shop.coverImage)}
                />
              </span>
            </ShopCoverMorph>
          ) : (
            <ShopTypeIcon type={shop.type} className="size-8" />
          )}
        </span>
        <span className="grid min-w-0 gap-1">
          <ShopNameMorph slug={shop.slug}>
            <h3 className="w-fit max-w-full font-display text-2xl leading-none font-bold uppercase">
              <DisplayName>{shop.name}</DisplayName>
            </h3>
          </ShopNameMorph>
          <span className="truncate text-sm text-[var(--pafta-soft)]">
            {locationLabel ? `${meta.label} · ${locationLabel}` : meta.label}
          </span>
          {isUnderRenovation(shop.slug) ? (
            <RenovationBadge className="text-xs" />
          ) : (
            <OpenStatusBadge week={week} exceptions={exceptions} className="text-xs" />
          )}
        </span>
        <span className="pafta-no" aria-hidden>
          {ticketNumber(index, total)}
        </span>
      </Link>
    </li>
  )
}

/** Numaralı bilet kartları: her dükkan baştan sona tıklanan bir bilet. */
export function PaftaShopTickets({
  shops,
  hideLocation = false,
}: {
  shops: readonly ShopCardData[]
  hideLocation?: boolean
}) {
  return (
    <ul className="grid gap-3 md:grid-cols-[repeat(auto-fill,minmax(300px,1fr))] md:gap-3.5">
      {shops.map((shop, index) => (
        <ShopTicket
          key={shop.id}
          shop={shop}
          index={index}
          total={shops.length}
          hideLocation={hideLocation}
        />
      ))}
    </ul>
  )
}
