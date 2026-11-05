import Link from 'next/link'
import { ROUTES } from '@/lib/constants/routes'
import { tr } from '@/lib/i18n/tr'
import { formatTrPhone, telHref } from '@/lib/utils/format'
import { ThemeToggle } from '@/components/theme-toggle'
import { MobileNav, type NavContact, type NavItem } from './mobile-nav'

interface SiteHeaderProps {
  brandName: string
  contact: NavContact
}

export const NAV_ITEMS: NavItem[] = [
  { href: ROUTES.homeSection('dukkanlar'), label: tr.nav.shops },
  { href: ROUTES.homeSection('mekanlar'), label: tr.nav.locations },
  { href: ROUTES.campaigns, label: tr.nav.campaigns },
]

export function SiteHeader({ brandName, contact }: SiteHeaderProps) {
  const phoneHref = contact.phone ? telHref(contact.phone) : null

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-4 sm:h-16 sm:px-6">
        <Link
          href={ROUTES.home}
          // Her sayfada ana sayfayı önceden indirmesin (~19 KB); gezinme yine çalışır.
          prefetch={false}
          className="-ml-1 flex min-h-12 items-center px-1 font-display text-3xl font-bold uppercase"
        >
          {brandName}
        </Link>

        <nav aria-label="Ana menü" className="ml-auto hidden items-center gap-1 md:flex">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-3 py-3 font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
          {phoneHref && contact.phone ? (
            <a
              href={phoneHref}
              data-track="call"
              className="ml-3 px-3 py-3 font-medium text-brand tabular-nums hover:underline"
            >
              {formatTrPhone(contact.phone)}
            </a>
          ) : null}
        </nav>

        <div className="flex items-center md:ml-1">
          <ThemeToggle />
          <MobileNav items={NAV_ITEMS} brandName={brandName} contact={contact} />
        </div>
      </div>
    </header>
  )
}
