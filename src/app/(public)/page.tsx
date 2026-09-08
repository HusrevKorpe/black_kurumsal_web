import { CampaignStrip } from '@/components/public/campaign-strip'
import { Hero } from '@/components/public/hero'
import { LocationCard } from '@/components/public/location-card'
import { SectionHeading } from '@/components/public/section-heading'
import { ShopCard } from '@/components/public/shop-card'
import { getActiveCampaigns } from '@/features/campaigns/queries'
import { getActiveLocations } from '@/features/locations/queries'
import { groupShopsByCategory } from '@/features/shops/group'
import { getActiveShops } from '@/features/shops/queries'
import { getSiteSettings } from '@/features/settings/queries'
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
  const groups = groupShopsByCategory(shops)

  return (
    <>
      <Hero title={settings.heroTitle} subtitle={settings.heroSubtitle} />

      <div className="mx-auto w-full max-w-6xl space-y-16 px-4 py-12 sm:px-6">
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
          <section id="mekanlar" className="scroll-mt-20" aria-labelledby="mekanlar-baslik">
            <SectionHeading title={tr.home.locationsTitle} subtitle={tr.home.locationsSubtitle} />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {locations.map((location) => (
                <LocationCard key={location.id} location={location} />
              ))}
            </div>
          </section>
        ) : null}

        <section id="dukkanlar" className="scroll-mt-20" aria-labelledby="dukkanlar-baslik">
          <SectionHeading
            title={tr.home.categoriesTitle}
            subtitle={tr.home.shopCount(shops.length)}
          />
          <nav aria-label="Kategoriler" className="mb-10 flex flex-wrap gap-2">
            {groups.map((group) => (
              <a
                key={group.key}
                href={`#${group.anchorId}`}
                className="rounded-full border bg-card px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
              >
                {group.label} <span className="text-muted-foreground">({group.shops.length})</span>
              </a>
            ))}
          </nav>

          <div className="space-y-14">
            {groups.map((group) => (
              <section
                key={group.key}
                id={group.anchorId}
                className="scroll-mt-20"
                aria-label={group.label}
              >
                <div className="mb-4">
                  <h3 className="text-xl font-semibold">{group.label}</h3>
                  <p className="text-sm text-muted-foreground">{group.description}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
                  {group.shops.map((shop) => (
                    <ShopCard key={shop.id} shop={shop} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
