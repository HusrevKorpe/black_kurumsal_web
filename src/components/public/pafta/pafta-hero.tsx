import Link from 'next/link'
import { Fragment } from 'react'
import { ShopNameMorph } from '../shop-morph'
import { PaftaTitle } from './pafta-title'

/** Konum satırındaki bağlantılar: 48 px'lik dokunma hedefi. */
const CRUMB_LINK_CLASS = 'inline-flex min-h-12 items-center hover:text-foreground'

interface PaftaHeroProps {
  /** Yalnız ana sayfa ve mekân sayfası (typedRoutes bu iki şablonu tanır). */
  crumbs: readonly { href: '/' | `/mekan/${string}`; label: string }[]
  name: string
  /** Başlığın altındaki kısa satır: "PlayStation Kafe · Çarşı". */
  subtitle: string
  lead?: string | null
  status?: React.ReactNode
  /** Sağ sütundaki çerçeveli kapak; yoksa başlık tam genişlik. */
  cover?: React.ReactNode
  /** Dükkan kartından geçişte ad büyüyerek taşınsın. */
  morphSlug?: string
}

/** Pafta'nın üst bölümü: solda konum satırı + dev ad, sağda çerçeveli kapak. */
export function PaftaHero({
  crumbs,
  name,
  subtitle,
  lead,
  status,
  cover,
  morphSlug,
}: PaftaHeroProps) {
  const heading = (
    <h1 className="w-full">
      <PaftaTitle name={name} />
    </h1>
  )
  return (
    <header
      className={
        cover
          ? 'grid grid-cols-[minmax(0,1fr)] gap-[18px] pt-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] md:items-start md:gap-12 md:pt-12'
          : 'grid grid-cols-[minmax(0,1fr)] gap-[18px] pt-3 md:pt-12'
      }
    >
      <div className="pafta-title-box grid min-w-0 content-start gap-3 md:gap-5 md:pt-10">
        <nav
          aria-label="Konum"
          className="-mb-2 flex flex-wrap items-center gap-1.5 text-sm text-[var(--pafta-soft)]"
        >
          {crumbs.map((crumb, index) => (
            <Fragment key={crumb.href}>
              {index > 0 ? <span aria-hidden>/</span> : null}
              <Link href={crumb.href} className={CRUMB_LINK_CLASS}>
                {crumb.label}
              </Link>
            </Fragment>
          ))}
        </nav>
        {morphSlug ? <ShopNameMorph slug={morphSlug}>{heading}</ShopNameMorph> : heading}
        <p className="font-medium">{subtitle}</p>
        {lead ? <p className="max-w-[40ch] text-[17px] leading-relaxed">{lead}</p> : null}
        {status}
      </div>
      {cover}
    </header>
  )
}
