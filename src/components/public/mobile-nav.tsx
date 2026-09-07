'use client'

import { MenuIcon } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { tr } from '@/lib/i18n/tr'

export interface NavItem {
  href: `/${string}`
  label: string
}

interface MobileNavProps {
  items: NavItem[]
  brandName: string
}

export function MobileNav({ items, brandName }: MobileNavProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon" aria-label={tr.nav.menu}>
              <MenuIcon />
            </Button>
          }
        />
        <SheetContent side="right" className="w-72">
          <SheetHeader>
            <SheetTitle>{brandName}</SheetTitle>
            <SheetDescription className="sr-only">{tr.nav.menu}</SheetDescription>
          </SheetHeader>
          <nav aria-label="Mobil menü" className="flex flex-col gap-1 px-4">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-3 py-3 text-base font-medium hover:bg-accent"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </div>
  )
}
