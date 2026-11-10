'use client'

import { MapPinnedIcon, PhoneIcon, ShieldCheckIcon } from 'lucide-react'
import Link from 'next/link'
import type { RefObject } from 'react'
import { InstagramIcon } from '@/components/icons'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { NavShopGroup } from '@/features/shops/nav'
import { ROUTES } from '@/lib/constants/routes'
import { tr } from '@/lib/i18n/tr'
import { formatTrPhone, telHref } from '@/lib/utils/format'
import { BrandLockup } from './brand-mark'
import type { NavContact, NavItem } from './mobile-nav'
import { ShopTypeIcon } from './shop-type-icon'

interface MobileNavSheetProps {
  id: string
  open: boolean
  onOpenChange: (open: boolean) => void
  items: NavItem[]
  brandName: string
  contact: NavContact
  /** Dükkan rehberi; boşsa menü yalnız sayfa bağlantılarını gösterir. */
  shopGroups?: NavShopGroup[]
  /** Tetikleyici düğme Sheet'in dışında kaldığından kapanınca odak ona elle döndürülür. */
  finalFocus: RefObject<HTMLButtonElement | null>
}

/** Menü satırı: 48 px yüksekliğinde, parmakla rahat. */
const ROW_CLASS =
  'flex min-h-12 items-center gap-3 rounded-md px-3 text-base font-medium hover:bg-accent'
const LABEL_CLASS = 'mb-1 px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase'

/**
 * Mobil menünün çekmecesi; `mobile-nav.tsx` bunu yalnızca menü ilk açıldığında yükler. Üstte
 * dükkanların kendisi (ana sayfadaki ağacın sırasıyla), altında kampanyalar, iletişim ve KVKK:
 * hangi sayfada olursa olsun aranan dükkana iki dokunuşta gidilir.
 */
export function MobileNavSheet({
  id,
  open,
  onOpenChange,
  items,
  brandName,
  contact,
  shopGroups = [],
  finalFocus,
}: MobileNavSheetProps) {
  const tel = contact.phone ? telHref(contact.phone) : null
  const hasContact = Boolean(tel || contact.instagramUrl)
  const close = () => onOpenChange(false)
  const hasDirectory = shopGroups.some((group) => group.links.length > 0)
  // Rehber varsa ana sayfadaki bölümlere (#dukkanlar) giden satırlar fazlalık.
  const pageItems = hasDirectory ? items.filter((item) => !item.href.startsWith('/#')) : items

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        id={id}
        side="right"
        // Portal `.public-theme` dışına açılır: sitenin renklerini kendisi taşır.
        className="public-theme gap-0 overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))] data-[side=right]:w-[min(20rem,88vw)] [&_[data-slot=sheet-close]]:top-1 [&_[data-slot=sheet-close]]:right-1 [&_[data-slot=sheet-close]]:size-12"
        finalFocus={finalFocus}
      >
        <SheetHeader className="items-start pt-3 pb-2">
          <SheetTitle className="font-normal">
            <Link
              href={ROUTES.home}
              onClick={close}
              aria-label={brandName}
              className="inline-flex min-h-12 items-center px-1"
            >
              <BrandLockup name={brandName} />
            </Link>
          </SheetTitle>
          <SheetDescription className="sr-only">{tr.nav.menu}</SheetDescription>
        </SheetHeader>

        <nav aria-label="Mobil menü" className="flex flex-col gap-5 px-4">
          {hasDirectory ? (
            <section aria-labelledby="mobil-dukkanlar">
              <h2 id="mobil-dukkanlar" className={LABEL_CLASS}>
                {tr.nav.shops}
              </h2>
              <div className="flex flex-col gap-3">
                {shopGroups.map((group) => (
                  <ul key={group.key} className="flex flex-col">
                    {group.title ? (
                      <li>
                        <Link
                          href={group.title.href}
                          onClick={close}
                          className="flex min-h-10 items-center gap-2 px-3 font-display text-lg leading-none font-bold text-brand uppercase"
                        >
                          <MapPinnedIcon aria-hidden className="size-4" />
                          {group.title.label}
                        </Link>
                      </li>
                    ) : null}
                    {group.links.map((link) => (
                      <li key={link.href}>
                        <Link href={link.href} onClick={close} className={ROW_CLASS}>
                          <span
                            aria-hidden
                            className="flex size-5 shrink-0 items-center justify-center text-muted-foreground"
                          >
                            {link.type ? (
                              <ShopTypeIcon type={link.type} className="size-5" />
                            ) : (
                              <MapPinnedIcon className="size-5" />
                            )}
                          </span>
                          <span className="min-w-0 flex-1 truncate">{link.label}</span>
                          {link.note ? (
                            <span className="shrink-0 text-xs font-normal text-muted-foreground">
                              {link.note}
                            </span>
                          ) : null}
                        </Link>
                      </li>
                    ))}
                  </ul>
                ))}
              </div>
            </section>
          ) : null}

          {pageItems.length > 0 ? (
            <ul
              className={hasDirectory ? 'flex flex-col gap-1 border-t pt-4' : 'flex flex-col gap-1'}
            >
              {pageItems.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} onClick={close} className={ROW_CLASS}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </nav>

        {/* Sitenin genel telefonu ve Instagram'ı buradan da ulaşılır. */}
        {hasContact ? (
          <section aria-labelledby="mobil-iletisim" className="mt-4 border-t px-4 pt-4">
            <h2 id="mobil-iletisim" className={LABEL_CLASS}>
              {tr.shop.contact}
            </h2>
            <ul className="flex flex-col gap-1">
              {tel && contact.phone ? (
                <li>
                  <a href={tel} data-track="call" onClick={close} className={ROW_CLASS}>
                    <PhoneIcon className="size-5 shrink-0 text-muted-foreground" />
                    <span>
                      {tr.common.call}{' '}
                      <span className="ml-1 font-normal text-muted-foreground">
                        {formatTrPhone(contact.phone)}
                      </span>
                    </span>
                  </a>
                </li>
              ) : null}
              {contact.instagramUrl ? (
                <li>
                  <a
                    href={contact.instagramUrl}
                    data-track="instagram"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={close}
                    className={ROW_CLASS}
                  >
                    <InstagramIcon className="size-5 shrink-0 text-muted-foreground" />
                    {tr.common.instagram}
                  </a>
                </li>
              ) : null}
            </ul>
          </section>
        ) : null}

        <div className="mt-4 border-t px-4 pt-3">
          <Link
            href={ROUTES.privacy}
            onClick={close}
            className="flex min-h-12 items-center gap-2 px-3 text-sm text-muted-foreground hover:text-foreground"
          >
            <ShieldCheckIcon aria-hidden className="size-4 text-brand" />
            {tr.footer.privacy}
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  )
}
