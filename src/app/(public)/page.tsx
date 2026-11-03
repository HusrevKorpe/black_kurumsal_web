import { CampaignStrip } from '@/components/public/campaign-strip'
import { LocationCard } from '@/components/public/location-card'
import { SectionHeading } from '@/components/public/section-heading'
import { ShopTree } from '@/components/public/shop-tree'
import { getActiveCampaigns } from '@/features/campaigns/queries'
import { getActiveLocations } from '@/features/locations/queries'
import { getSiteSettings } from '@/features/settings/queries'
import { getActiveShops } from '@/features/shops/queries'
import { ROUTES } from '@/lib/constants/routes'
import { tr } from '@/lib/i18n/tr'

export const revalidate = 3600

export default async function HomePage() {
  const now = new Date()
  const [settings, campaigns, locations, shops] = await Promise.all([
    getSiteSettings(),
    getActiveCampaigns(now, 8),
    getActiveLocations(),
    getActiveShops(),
  ])

  return (
    <>
      <ShopTree
        brandName={settings.brandName}
        title={settings.heroTitle}
        subtitle={settings.heroSubtitle}
        shops={shops}
      />

      <div className="mx-auto w-full max-w-6xl space-y-14 px-4 pt-12 sm:px-6 lg:space-y-24 lg:pt-20">
        {campaigns.length > 0 ? (
          <section aria-labelledby="kampanyalar-baslik">
            <SectionHeading
              title={tr.home.campaignsTitle}
              action={{ href: ROUTES.campaigns, label: tr.common.seeAll }}
            />
            <CampaignStrip campaigns={campaigns} />
          </section>
        ) : null}

        {locations.length > 0 ? (
          <section id="mekanlar" className="scroll-mt-16" aria-labelledby="mekanlar-baslik">
            <SectionHeading title={tr.home.locationsTitle} subtitle={tr.home.locationsSubtitle} />
            <div className="grid gap-3 sm:grid-cols-2 lg:gap-6">
              {locations.map((location) => (
                <LocationCard key={location.id} location={location} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  )
}
