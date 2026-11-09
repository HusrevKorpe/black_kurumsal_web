import { ArrowUpRightIcon } from 'lucide-react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import type { CampaignScope } from '@/generated/prisma/enums'
import type { Media } from '@/generated/prisma/client'
import { ROUTES } from '@/lib/constants/routes'
import { tr } from '@/lib/i18n/tr'
import { cn } from '@/lib/utils'
import { isPlaceholderCampaignImage } from '@/features/campaigns/placeholder'
import { formatDateTr } from '@/lib/utils/format'
import { CoverImage } from './cover-image'

export interface CampaignCardInput {
  id: string
  title: string
  description: string | null
  image: Pick<Media, 'bucket' | 'path' | 'alt'> & Partial<Pick<Media, 'uploadedById'>>
  scope: CampaignScope
  ctaLabel: string | null
  ctaUrl: string | null
  endsAt: Date | null
  shop?: { slug: string; name: string } | null
  location?: { slug: string; name: string } | null
}

interface CampaignCardProps {
  campaign: CampaignCardInput
  /** Kampanyanın ait olduğu sayfadaysak hedef bağlantısı gösterilmez. */
  hideTarget?: boolean
  /** Hedefi ve düğme bağlantısı olmayan kampanyanın kartı buraya gider (ana sayfa şeridi). */
  fallbackHref?: typeof ROUTES.campaigns
  priority?: boolean
  /** Kart bir h2 bölümü altındaysa h3 (varsayılan); doğrudan h1 altındaysa h2 (başlık sırası). */
  headingLevel?: 'h2' | 'h3'
}

function scopeLine(campaign: CampaignCardInput) {
  if (campaign.scope === 'SHOP' && campaign.shop) {
    return { label: campaign.shop.name, href: ROUTES.shop(campaign.shop.slug) }
  }
  if (campaign.scope === 'LOCATION' && campaign.location) {
    return { label: campaign.location.name, href: ROUTES.location(campaign.location.slug) }
  }
  return { label: tr.campaigns.scopeGlobal, href: null }
}

/**
 * Kartı baştan sona kaplayan görünmez tıklama alanı: başlıktaki tek bağlantı ::after ile
 * karta yayılır. İç içe bağlantı doğmaz, düğme z-10 ile üstte kalır. Odak halkası içeri
 * çizilir (-outline-offset): kartın overflow-hidden'ı dışarıdaki halkayı kırpardı.
 */
/**
 * Gerçek görseli olmayan kampanyanın kapağı: yer tutucu renk geçişinin yerine siyah zeminde altın
 * taç ve kampanyanın sahibi (dükkan, mekân ya da marka). Başlık kartın altında zaten yazar.
 */
function CampaignPoster({ label }: { label: string }) {
  return (
    <div
      aria-hidden
      className="campaign-poster absolute inset-0 flex flex-col items-center justify-center gap-2.5 px-6 text-center"
    >
      <svg viewBox="0 0 24 14" className="h-7 w-auto text-brand" focusable="false">
        <path
          d="M2 3.5 7 8l5-7 5 7 5-4.5L20 13H4Z"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        <circle cx="2" cy="3" r="1.6" fill="currentColor" />
        <circle cx="12" cy="1.2" r="1.6" fill="currentColor" />
        <circle cx="22" cy="3" r="1.6" fill="currentColor" />
      </svg>
      <span className="font-display text-3xl leading-none font-bold tracking-wide uppercase">
        {label}
      </span>
      <span className="h-0.5 w-14 bg-brand" />
    </div>
  )
}

const STRETCHED =
  'after:absolute after:inset-0 after:content-[""] hover:underline focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring'

export function CampaignCard({
  campaign,
  hideTarget = false,
  fallbackHref,
  priority = false,
  headingLevel: Heading = 'h3',
}: CampaignCardProps) {
  const scope = scopeLine(campaign)
  const placeholder = isPlaceholderCampaignImage(campaign.image, campaign.title)
  // Kartın her yeri tıklanır: dükkan/mekan kampanyası doğrudan o sayfaya gider. Dükkanın
  // kendi sayfasındaysak (hideTarget) hedef yoktur — zaten oradayız — ve kart varsa düğme
  // bağlantısına gider.
  const cardHref = hideTarget ? null : scope.href
  const isExternal = campaign.ctaUrl ? /^https?:\/\//.test(campaign.ctaUrl) : false
  // Hedefi de düğmesi de olmayan kart (genel kampanya) hiç değilse kampanyalar sayfasına gitsin.
  const href = cardHref ?? (campaign.ctaUrl ? null : (fallbackHref ?? null))
  const linked = href !== null || campaign.ctaUrl !== null
  // Kart dükkana gidiyorsa düğme kendi bağlantısını korur; gitmiyorsa kartın bağlantısı
  // zaten düğmeninkidir: düğme görünür kalır, tıklamayı kartı kaplayan bağlantı alır.
  const ctaIsSeparate = cardHref !== null
  const ctaClass = buttonVariants({ size: 'sm', variant: 'outline' })
  const ctaContent = (
    <>
      {campaign.ctaLabel ?? tr.common.seeAll}
      <ArrowUpRightIcon data-icon="inline-end" />
    </>
  )

  return (
    <article className={cn('group relative flex h-full flex-col overflow-hidden bg-card')}>
      <div className="relative aspect-video overflow-hidden">
        {placeholder ? (
          <CampaignPoster label={scope.href ? scope.label : tr.common.brand} />
        ) : (
          <CoverImage
            media={campaign.image}
            alt={campaign.title}
            sizes="(min-width: 1024px) 40vw, (min-width: 640px) 60vw, 85vw"
            priority={priority}
            className={cn(linked && 'transition-transform duration-500 group-hover:scale-[1.03]')}
          />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {!hideTarget ? (
          <span
            className={cn(
              'text-sm font-medium',
              scope.href ? 'text-brand' : 'text-muted-foreground',
            )}
          >
            {scope.label}
          </span>
        ) : null}
        <Heading className="font-display text-2xl leading-tight font-bold uppercase">
          {href ? (
            <Link
              href={href}
              data-track="campaign"
              data-track-campaign={campaign.id}
              className={STRETCHED}
            >
              {campaign.title}
            </Link>
          ) : campaign.ctaUrl ? (
            <a
              href={campaign.ctaUrl}
              data-track="campaign"
              data-track-campaign={campaign.id}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              className={STRETCHED}
            >
              {campaign.title}
            </a>
          ) : (
            campaign.title
          )}
        </Heading>
        {campaign.description ? (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {campaign.description}
          </p>
        ) : null}
        <div className="mt-auto flex items-center justify-between gap-3 pt-2">
          {campaign.endsAt ? (
            <span className="text-xs text-muted-foreground">
              {tr.campaigns.validUntil(formatDateTr(campaign.endsAt))}
            </span>
          ) : (
            <span />
          )}
          {campaign.ctaUrl ? (
            ctaIsSeparate ? (
              <a
                href={campaign.ctaUrl}
                data-track="campaign"
                data-track-campaign={campaign.id}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className={cn('relative z-10', ctaClass)}
              >
                {ctaContent}
              </a>
            ) : (
              <span className={ctaClass} aria-hidden>
                {ctaContent}
              </span>
            )
          ) : null}
        </div>
      </div>
    </article>
  )
}
