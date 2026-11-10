import { PhoneIcon, ShieldCheckIcon } from 'lucide-react'
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
const LIST_CLASS = '-my-2.5 text-sm text-muted-foreground sm:my-0 sm:space-y-2'
const LINK_CLASS = 'inline-flex min-h-11 items-center gap-2 hover:text-foreground sm:min-h-0'

export function SiteFooter({ settings }: SiteFooterProps) {
  const phoneHref = settings.contactPhone ? telHref(settings.contactPhone) : null

  return (
    <footer className="mt-16 overflow-hidden border-t">
      {/* Bağlantılar ve iletişim yan yana; marka alttaki dev yazıda. Açılıştaki tanıtım cümlesi
          burada tekrar edilmez. */}
      <div className="mx-auto grid w-full max-w-7xl grid-cols-2 gap-x-6 gap-y-8 px-4 py-10 sm:grid-cols-3 md:px-6 lg:px-12">
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
            <li>
              <Link
                href={ROUTES.privacy}
                className={`${LINK_CLASS} font-medium text-foreground underline-offset-4 hover:underline`}
              >
                <ShieldCheckIcon className="size-4 text-brand" /> {tr.footer.privacy}
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
      {/* Dev harflerin kutusu dar satır yüksekliğinden ~90 px yukarı taşar, üstteki bağlantıların
          tıklamasını yutmasın diye pointer-events-none. */}
      <div
        aria-hidden
        data-wordmark={settings.brandName}
        className="footer-wordmark pointer-events-none mx-auto w-full max-w-7xl px-4 font-display font-bold uppercase md:px-6 lg:px-12"
        style={{ '--brand-length': settings.brandName.length } as React.CSSProperties}
      />
      <div className="border-t">
        <p className="mx-auto w-full max-w-7xl px-4 py-4 text-xs text-muted-foreground md:px-6 lg:px-12">
          {tr.footer.rights(new Date().getFullYear())}
        </p>
      </div>
    </footer>
  )
}
