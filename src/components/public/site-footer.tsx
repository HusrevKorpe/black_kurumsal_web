import { PhoneIcon } from 'lucide-react'
import { InstagramIcon } from '@/components/icons'
import Link from 'next/link'
import type { SiteSettings } from '@/generated/prisma/client'
import { ROUTES } from '@/lib/constants/routes'
import { tr } from '@/lib/i18n/tr'
import { formatTrPhone, telHref } from '@/lib/utils/format'

interface SiteFooterProps {
  settings: SiteSettings
}

export function SiteFooter({ settings }: SiteFooterProps) {
  const phoneHref = settings.contactPhone ? telHref(settings.contactPhone) : null

  return (
    <footer className="mt-16 border-t bg-card/40">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
        <div>
          <p className="text-lg font-semibold">{settings.brandName}</p>
          {settings.heroSubtitle ? (
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {settings.heroSubtitle}
            </p>
          ) : null}
        </div>

        <nav aria-label={tr.footer.quickLinks}>
          <p className="mb-3 text-sm font-semibold">{tr.footer.quickLinks}</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link href={ROUTES.homeSection('dukkanlar')} className="hover:text-foreground">
                {tr.nav.shops}
              </Link>
            </li>
            <li>
              <Link href={ROUTES.homeSection('mekanlar')} className="hover:text-foreground">
                {tr.nav.locations}
              </Link>
            </li>
            <li>
              <Link href={ROUTES.campaigns} className="hover:text-foreground">
                {tr.nav.campaigns}
              </Link>
            </li>
          </ul>
        </nav>

        <div>
          <p className="mb-3 text-sm font-semibold">{tr.footer.contact}</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {phoneHref && settings.contactPhone ? (
              <li>
                <a
                  href={phoneHref}
                  data-track="call"
                  className="inline-flex items-center gap-2 hover:text-foreground"
                >
                  <PhoneIcon className="size-4" /> {formatTrPhone(settings.contactPhone)}
                </a>
              </li>
            ) : null}
            {settings.instagramUrl ? (
              <li>
                <a
                  href={settings.instagramUrl}
                  data-track="instagram"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 hover:text-foreground"
                >
                  <InstagramIcon className="size-4" /> {tr.common.instagram}
                </a>
              </li>
            ) : null}
          </ul>
        </div>
      </div>
      <div className="border-t">
        <p className="mx-auto w-full max-w-6xl px-4 py-4 text-xs text-muted-foreground sm:px-6">
          {tr.footer.rights(new Date().getFullYear())}
        </p>
      </div>
    </footer>
  )
}
