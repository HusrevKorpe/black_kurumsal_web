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

/**
 * Telefonda 44 px'lik dokunma hedefi; geniş ekranda eski sıkı satır aralığı. Listenin eksi dikey
 * boşluğu, satır yüksekliğinin fazlasını yutar ki başlıkla ilk bağlantının arası değişmesin.
 */
const LIST_CLASS = '-my-3 text-sm text-muted-foreground sm:my-0 sm:space-y-2'
const LINK_CLASS = 'inline-flex min-h-12 items-center gap-2 hover:text-foreground sm:min-h-0'

export function SiteFooter({ settings }: SiteFooterProps) {
  const phoneHref = settings.contactPhone ? telHref(settings.contactPhone) : null

  return (
    <footer className="mt-16 overflow-hidden border-t">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
        <div>
          {settings.heroSubtitle ? (
            <p className="text-sm leading-relaxed text-muted-foreground">{settings.heroSubtitle}</p>
          ) : null}
        </div>

        <nav aria-label={tr.footer.quickLinks}>
          <p className="mb-3 text-sm font-semibold">{tr.footer.quickLinks}</p>
          <ul className={LIST_CLASS}>
            <li>
              <Link href={ROUTES.homeSection('dukkanlar')} className={LINK_CLASS}>
                {tr.nav.shops}
              </Link>
            </li>
            <li>
              <Link href={ROUTES.homeSection('mekanlar')} className={LINK_CLASS}>
                {tr.nav.locations}
              </Link>
            </li>
            <li>
              <Link href={ROUTES.campaigns} className={LINK_CLASS}>
                {tr.nav.campaigns}
              </Link>
            </li>
          </ul>
        </nav>

        {phoneHref || settings.instagramUrl ? (
          <div>
            <p className="mb-3 text-sm font-semibold">{tr.footer.contact}</p>
            <ul className={LIST_CLASS}>
              {phoneHref && settings.contactPhone ? (
                <li>
                  <a href={phoneHref} data-track="call" className={LINK_CLASS}>
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
                    className={LINK_CLASS}
                  >
                    <InstagramIcon className="size-4" /> {tr.common.instagram}
                  </a>
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}
      </div>
      <div
        aria-hidden
        data-wordmark={settings.brandName}
        className="footer-wordmark mx-auto w-full max-w-6xl px-4 font-display font-bold uppercase sm:px-6"
        style={{ '--brand-length': settings.brandName.length } as React.CSSProperties}
      />
      <div className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-x-6 px-4 py-2 text-xs text-muted-foreground sm:px-6">
          <p className="py-2">{tr.footer.rights(new Date().getFullYear())}</p>
          <Link
            href={ROUTES.privacy}
            className="inline-flex min-h-11 items-center underline-offset-4 hover:text-foreground hover:underline"
          >
            {tr.footer.privacy}
          </Link>
        </div>
      </div>
    </footer>
  )
}
