'use client'

import { MenuIcon } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { whenIdleAfterLoad } from '@/lib/browser/idle'
import type { NavShopGroup } from '@/features/shops/nav'
import { tr } from '@/lib/i18n/tr'

export interface NavItem {
  href: `/${string}`
  label: string
}

/** Site ayarlarından gelen genel iletişim; menünün altında Ara / Instagram olarak çıkar. */
export interface NavContact {
  phone: string | null
  instagramUrl: string | null
}

interface MobileNavProps {
  items: NavItem[]
  brandName: string
  contact: NavContact
  shopGroups?: NavShopGroup[]
}

const SHEET_ID = 'mobil-menu'

// Çekmece (base-ui Dialog, ~55 KB gz) açık sitenin ilk paketine girmez: yalnızca menü ilk kez
// açıldığında render edilir. Kod, ilk açılış yükünü büyütmesin diye sayfa boşaldıktan birkaç saniye
// sonra ya da düğmeye dokunulduğu an indirilir; başarısız olursa açılışta yeniden denenir (plan §12).
const SHEET_PRELOAD_DELAY_MS = 3000
const loadSheet = () => import('./mobile-nav-sheet')
const preloadSheet = () => {
  loadSheet().catch(() => undefined)
}
const MobileNavSheet = dynamic(() => loadSheet().then((m) => m.MobileNavSheet), { ssr: false })

export function MobileNav({ items, brandName, contact, shopGroups }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  // İlk açılıştan sonra takılı kalır: kapanış animasyonu oynar, ikinci açılış anında olur.
  const [mounted, setMounted] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    let timer: number | undefined
    const cancelIdle = whenIdleAfterLoad(() => {
      timer = window.setTimeout(preloadSheet, SHEET_PRELOAD_DELAY_MS)
    })
    return () => {
      cancelIdle()
      window.clearTimeout(timer)
    }
  }, [])

  return (
    <div className="md:hidden">
      {/* Düz düğme: base-ui ve sınıf birleştirici her sayfanın ilk paketine girmesin. */}
      <button
        ref={triggerRef}
        type="button"
        className="-mr-2 inline-flex size-12 items-center justify-center rounded-lg outline-none hover:bg-muted/50 focus-visible:ring-3 focus-visible:ring-ring/50 aria-expanded:bg-muted/50 [&_svg]:size-6"
        aria-label={tr.nav.menu}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? SHEET_ID : undefined}
        onPointerDown={preloadSheet}
        onClick={() => {
          setMounted(true)
          setOpen(true)
        }}
      >
        <MenuIcon />
      </button>
      {mounted ? (
        <MobileNavSheet
          id={SHEET_ID}
          open={open}
          onOpenChange={setOpen}
          items={items}
          brandName={brandName}
          contact={contact}
          shopGroups={shopGroups}
          finalFocus={triggerRef}
        />
      ) : null}
    </div>
  )
}
