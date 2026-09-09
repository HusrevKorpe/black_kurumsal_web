import { ArrowUpRightIcon } from 'lucide-react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import type { CampaignScope } from '@/generated/prisma/enums'
import type { Media } from '@/generated/prisma/client'
import { ROUTES } from '@/lib/constants/routes'
import { tr } from '@/lib/i18n/tr'
import { cn } from '@/lib/utils'
import { formatDateTr } from '@/lib/utils/format'
import { CoverImage } from './cover-image'

export interface CampaignCardInput {
  id: string
  title: string
  description: string | null
  image: Pick<Media, 'bucket' | 'path' | 'alt'>
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
const STRETCHED =
  'after:absolute after:inset-0 after:content-[""] hover:underline focus-visible:outline-none focus-visible:after:rounded-xl focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-ring'

export function CampaignCard({
  campaign,
  hideTarget = false,
  fallbackHref,
  priority = false,
  headingLevel: Heading = 'h3',
}: CampaignCardProps) {
  const scope = scopeLine(campaign)
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
    <article
      className={cn(
        'group relative flex h-full flex-col overflow-hidden rounded-xl border bg-card',
        linked && 'transition-shadow hover:shadow-lg',
      )}
    >
      <div className="relative aspect-video overflow-hidden">
        <CoverImage
          media={campaign.image}
          alt={campaign.title}
          sizes="(min-width: 1024px) 40vw, (min-width: 640px) 60vw, 85vw"
          priority={priority}
          className={cn(linked && 'transition-transform duration-300 group-hover:scale-[1.03]')}
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {!hideTarget ? (
          <span
            className={cn(
              'text-xs font-medium tracking-wide uppercase',
              scope.href ? 'text-brand' : 'text-muted-foreground',
            )}
          >
            {scope.label}
          </span>
        ) : null}
        <Heading className="text-lg leading-snug font-semibold">
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
