'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ROUTES } from '@/lib/constants/routes'
import { tr } from '@/lib/i18n/tr'
import { cn } from '@/lib/utils'

interface ShopTabsProps {
  shopId: string
}

export function ShopTabs({ shopId }: ShopTabsProps) {
  const pathname = usePathname()
  const base = ROUTES.admin.shop(shopId)
  const tabs = [
    { href: base, label: tr.admin.shops.tabs.info, exact: true },
    { href: `${base}/saatler` as const, label: tr.admin.shops.tabs.hours },
    { href: `${base}/galeri` as const, label: tr.admin.shops.tabs.gallery },
    { href: `${base}/fiyatlar` as const, label: tr.admin.shops.tabs.prices },
  ]

  return (
    <nav aria-label="Dükkan sekmeleri" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      <ul className="flex gap-1 border-b">
        {tabs.map((tab) => {
          const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href)
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  '-mb-px inline-block border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
                  active
                    ? 'border-brand text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {tab.label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
