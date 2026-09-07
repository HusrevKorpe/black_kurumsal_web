import { ArrowUpRightIcon } from 'lucide-react'
import Link from 'next/link'
import { buttonVariants } from '@/components/ui/button'
import type { CampaignScope } from '@/generated/prisma/enums'
import type { Media } from '@/generated/prisma/client'
import { ROUTES } from '@/lib/constants/routes'
import { tr } from '@/lib/i18n/tr'
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

export function CampaignCard({
  campaign,
  hideTarget = false,
  priority = false,
  headingLevel: Heading = 'h3',
}: CampaignCardProps) {
  const scope = scopeLine(campaign)
  const isExternal = campaign.ctaUrl ? /^https?:\/\//.test(campaign.ctaUrl) : false

  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border bg-card">
      <div className="relative aspect-video">
        <CoverImage
          media={campaign.image}
          alt={campaign.title}
          sizes="(min-width: 1024px) 40vw, (min-width: 640px) 60vw, 85vw"
          priority={priority}
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        {!hideTarget ? (
          scope.href ? (
            <Link
              href={scope.href}
              data-track={campaign.scope === 'SHOP' ? 'shop' : 'location'}
              className="text-xs font-medium tracking-wide text-brand uppercase hover:underline"
            >
              {scope.label}
            </Link>
          ) : (
            <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {scope.label}
            </span>
          )
        ) : null}
        <Heading className="text-lg leading-snug font-semibold">{campaign.title}</Heading>
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
            <a
              href={campaign.ctaUrl}
              data-track="campaign"
              data-track-campaign={campaign.id}
              target={isExternal ? '_blank' : undefined}
              rel={isExternal ? 'noopener noreferrer' : undefined}
              className={buttonVariants({ size: 'sm', variant: 'outline' })}
            >
              {campaign.ctaLabel ?? tr.common.seeAll}
              <ArrowUpRightIcon data-icon="inline-end" />
            </a>
          ) : null}
        </div>
      </div>
    </article>
  )
}
