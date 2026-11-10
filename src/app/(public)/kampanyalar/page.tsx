import { CalendarDaysIcon, StoreIcon } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { CampaignCard } from '@/components/public/campaign-card'
import { SectionHeading } from '@/components/public/section-heading'
import { getActiveCampaigns } from '@/features/campaigns/queries'
import { ROUTES } from '@/lib/constants/routes'
import { tr } from '@/lib/i18n/tr'

export const revalidate = 3600

export const metadata: Metadata = {
  title: tr.campaigns.title,
  description: tr.campaigns.subtitle,
  alternates: { canonical: '/kampanyalar' },
}

export default async function CampaignsPage() {
  const campaigns = await getActiveCampaigns()
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-12 md:px-6 lg:px-12">
      <SectionHeading as="h1" title={tr.campaigns.title} subtitle={tr.campaigns.subtitle} />
      {campaigns.length === 0 ? (
        // Boş sayfa çıkışsız kalmasın: dükkanlara ve etkinliklere tek dokunuşla geçilir.
        <div className="max-w-xl border bg-card p-5 sm:p-6">
          <p className="text-lg font-semibold">{tr.campaigns.empty}</p>
          <p className="mt-1 text-sm text-muted-foreground">{tr.campaigns.emptyHint}</p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <Link
              href={ROUTES.homeSection('dukkanlar')}
              className="inline-flex min-h-12 items-center gap-2 bg-brand px-4 font-semibold text-brand-foreground transition-opacity hover:opacity-90"
            >
              <StoreIcon aria-hidden className="size-5" /> {tr.campaigns.browseShops}
            </Link>
            <Link
              href={ROUTES.homeSection('etkinlikler')}
              className="inline-flex min-h-12 items-center gap-2 border px-4 font-semibold transition-colors hover:bg-accent"
            >
              <CalendarDaysIcon aria-hidden className="size-5 text-brand" />{' '}
              {tr.campaigns.seeEvents}
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {campaigns.map((campaign, i) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              priority={i < 3}
              headingLevel="h2"
            />
          ))}
        </div>
      )}
    </div>
  )
}
