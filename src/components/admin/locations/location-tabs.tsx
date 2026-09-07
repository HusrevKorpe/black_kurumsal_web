'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ROUTES } from '@/lib/constants/routes'
import { tr } from '@/lib/i18n/tr'
import { cn } from '@/lib/utils'

interface LocationTabsProps {
  locationId: string
  isVenue: boolean
}

/** Bölge (DISTRICT) için saat ve galeri anlamsız; sekmeler yalnızca mekanda çıkar. */
export function LocationTabs({ locationId, isVenue }: LocationTabsProps) {
  const pathname = usePathname()
  const base = ROUTES.admin.location(locationId)
  const tabs = [
    { href: base, label: tr.admin.locations.tabs.info, exact: true },
    ...(isVenue
      ? [
          { href: `${base}/saatler` as const, label: tr.admin.locations.tabs.hours, exact: false },
          { href: `${base}/galeri` as const, label: tr.admin.locations.tabs.gallery, exact: false },
        ]
      : []),
  ]

  return (
    <nav aria-label="Mekan sekmeleri" className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
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
