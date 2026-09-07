import Link from 'next/link'
import { ROUTES } from '@/lib/constants/routes'
import { tr } from '@/lib/i18n/tr'
import { MobileNav, type NavItem } from './mobile-nav'

interface SiteHeaderProps {
  brandName: string
}

export const NAV_ITEMS: NavItem[] = [
  { href: ROUTES.homeSection('dukkanlar'), label: tr.nav.shops },
  { href: ROUTES.homeSection('mekanlar'), label: tr.nav.locations },
  { href: ROUTES.campaigns, label: tr.nav.campaigns },
]

export function SiteHeader({ brandName }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6">
        <Link
          href={ROUTES.home}
          className="flex items-center gap-2 text-lg font-semibold tracking-tight"
        >
          <span className="inline-flex size-8 items-center justify-center rounded-md bg-brand text-base font-bold text-brand-foreground">
            {brandName.charAt(0).toUpperCase()}
          </span>
          <span>{brandName}</span>
        </Link>

        <nav aria-label="Ana menü" className="hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <MobileNav items={NAV_ITEMS} brandName={brandName} />
      </div>
    </header>
  )
}
