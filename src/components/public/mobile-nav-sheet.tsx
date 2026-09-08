'use client'

import { PhoneIcon } from 'lucide-react'
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
import { tr } from '@/lib/i18n/tr'
import { formatTrPhone, telHref } from '@/lib/utils/format'
import type { NavContact, NavItem } from './mobile-nav'

interface MobileNavSheetProps {
  id: string
  open: boolean
  onOpenChange: (open: boolean) => void
  items: NavItem[]
  brandName: string
  contact: NavContact
  /** Tetikleyici düğme Sheet'in dışında kaldığından kapanınca odak ona elle döndürülür. */
  finalFocus: RefObject<HTMLButtonElement | null>
}

/** Menü satırı: 48 px yüksekliğinde, parmakla rahat. */
const ROW_CLASS =
  'flex min-h-12 items-center gap-3 rounded-md px-3 text-base font-medium hover:bg-accent'

/** Mobil menünün çekmecesi; `mobile-nav.tsx` bunu yalnızca menü ilk açıldığında yükler. */
export function MobileNavSheet({
  id,
  open,
  onOpenChange,
  items,
  brandName,
  contact,
  finalFocus,
}: MobileNavSheetProps) {
  const tel = contact.phone ? telHref(contact.phone) : null
  const hasContact = Boolean(tel || contact.instagramUrl)
  const close = () => onOpenChange(false)

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent id={id} side="right" className="w-72" finalFocus={finalFocus}>
        <SheetHeader>
          <SheetTitle>{brandName}</SheetTitle>
          <SheetDescription className="sr-only">{tr.nav.menu}</SheetDescription>
        </SheetHeader>
        <nav aria-label="Mobil menü" className="flex flex-col gap-1 px-4">
          {items.map((item) => (
            <Link key={item.href} href={item.href} onClick={close} className={ROW_CLASS}>
              {item.label}
            </Link>
          ))}
        </nav>
        {/* Menünün altı boş kalmasın: sitenin genel telefonu ve Instagram'ı buradan da ulaşılır. */}
        {hasContact ? (
          <section aria-labelledby="mobil-iletisim" className="border-t px-4 pt-4">
            <h2
              id="mobil-iletisim"
              className="mb-1 px-3 text-xs font-medium tracking-wide text-muted-foreground uppercase"
            >
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
      </SheetContent>
    </Sheet>
  )
}
