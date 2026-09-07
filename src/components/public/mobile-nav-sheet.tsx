'use client'

import Link from 'next/link'
import type { RefObject } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { tr } from '@/lib/i18n/tr'
import type { NavItem } from './mobile-nav'

interface MobileNavSheetProps {
  id: string
  open: boolean
  onOpenChange: (open: boolean) => void
  items: NavItem[]
  brandName: string
  /** Tetikleyici düğme Sheet'in dışında kaldığından kapanınca odak ona elle döndürülür. */
  finalFocus: RefObject<HTMLButtonElement | null>
}

/** Mobil menünün çekmecesi; `mobile-nav.tsx` bunu yalnızca menü ilk açıldığında yükler. */
export function MobileNavSheet({
  id,
  open,
  onOpenChange,
  items,
  brandName,
  finalFocus,
}: MobileNavSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent id={id} side="right" className="w-72" finalFocus={finalFocus}>
        <SheetHeader>
          <SheetTitle>{brandName}</SheetTitle>
          <SheetDescription className="sr-only">{tr.nav.menu}</SheetDescription>
        </SheetHeader>
        <nav aria-label="Mobil menü" className="flex flex-col gap-1 px-4">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onOpenChange(false)}
              className="rounded-md px-3 py-3 text-base font-medium hover:bg-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
