import type { Metadata } from 'next'
import { CampaignCard } from '@/components/public/campaign-card'
import { SectionHeading } from '@/components/public/section-heading'
import { getActiveCampaigns } from '@/features/campaigns/queries'
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
    <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6">
      <SectionHeading as="h1" title={tr.campaigns.title} subtitle={tr.campaigns.subtitle} />
      {campaigns.length === 0 ? (
        <p className="text-muted-foreground">{tr.campaigns.empty}</p>
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
