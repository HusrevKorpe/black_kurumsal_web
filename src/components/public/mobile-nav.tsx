'use client'

import { MenuIcon } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { whenIdleAfterLoad } from '@/lib/browser/idle'
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
}

const SHEET_ID = 'mobil-menu'

// Çekmece (base-ui Dialog, ~55 KB gz) açık sitenin ilk paketine girmez: yalnızca menü ilk kez
// açıldığında render edilir. Kodu sayfa yüklenip boşa çıkınca önceden indirilir ki ilk dokunuşta
// bekleme olmasın; indirme başarısız olursa açılışta yeniden denenir (plan §12).
const loadSheet = () => import('./mobile-nav-sheet')
const MobileNavSheet = dynamic(() => loadSheet().then((m) => m.MobileNavSheet), { ssr: false })

export function MobileNav({ items, brandName, contact }: MobileNavProps) {
  const [open, setOpen] = useState(false)
  // İlk açılıştan sonra takılı kalır: kapanış animasyonu oynar, ikinci açılış anında olur.
  const [mounted, setMounted] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(
    () =>
      whenIdleAfterLoad(() => {
        loadSheet().catch(() => undefined)
      }),
    [],
  )

  return (
    <div className="md:hidden">
      <Button
        ref={triggerRef}
        variant="ghost"
        size="icon"
        aria-label={tr.nav.menu}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? SHEET_ID : undefined}
        onClick={() => {
          setMounted(true)
          setOpen(true)
        }}
      >
        <MenuIcon />
      </Button>
      {mounted ? (
        <MobileNavSheet
          id={SHEET_ID}
          open={open}
          onOpenChange={setOpen}
          items={items}
          brandName={brandName}
          contact={contact}
          finalFocus={triggerRef}
        />
      ) : null}
    </div>
  )
}
