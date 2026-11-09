import { CampaignStrip } from '@/components/public/campaign-strip'
import { EventCalendar } from '@/components/public/event-calendar'
import { LocationCard } from '@/components/public/location-card'
import { SectionHeading } from '@/components/public/section-heading'
import { ShopTree } from '@/components/public/shop-tree'
import { getActiveCampaigns } from '@/features/campaigns/queries'
import { dayKey } from '@/features/events/calendar'
import { getCalendarEvents } from '@/features/events/queries'
import { getActiveLocations } from '@/features/locations/queries'
import { getSiteSettings } from '@/features/settings/queries'
import { getActiveShops } from '@/features/shops/queries'
import { buildOrganizationJsonLd, serializeJsonLd } from '@/features/shops/json-ld'
import { ROUTES } from '@/lib/constants/routes'
import { SITE_DESCRIPTION } from '@/lib/constants/site'
import { publicEnv } from '@/lib/env'
import { tr } from '@/lib/i18n/tr'

export const revalidate = 3600

export default async function HomePage() {
  const now = new Date()
  const today = dayKey(now)
  const [settings, campaigns, events, locations, shops] = await Promise.all([
    getSiteSettings(),
    getActiveCampaigns(now, 8),
    getCalendarEvents(now),
    getActiveLocations(),
    getActiveShops(),
  ])

  const siteUrl = publicEnv.NEXT_PUBLIC_SITE_URL
  const jsonLd = buildOrganizationJsonLd({
    name: settings.brandName,
    siteUrl,
    logo: `${siteUrl}/apple-icon.png`,
    description: SITE_DESCRIPTION,
    phone: settings.contactPhone,
    email: settings.contactEmail,
    sameAs: [settings.instagramUrl, settings.facebookUrl],
    places: [
      ...shops.map((shop) => ({ name: shop.name, url: `${siteUrl}${ROUTES.shop(shop.slug)}` })),
      ...locations
        .filter((location) => location.kind === 'VENUE')
        .map((location) => ({
          name: location.name,
          url: `${siteUrl}${ROUTES.location(location.slug)}`,
        })),
    ],
  })

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />
      <ShopTree
        brandName={settings.brandName}
        title={settings.heroTitle}
        subtitle={settings.heroSubtitle}
        shops={shops}
        locations={locations}
      />

      <div className="mx-auto w-full max-w-6xl space-y-14 px-4 pt-12 sm:px-6 lg:space-y-24 lg:pt-20">
        {campaigns.length > 0 ? (
          <section aria-labelledby="kampanyalar-baslik">
            <SectionHeading
              id="kampanyalar-baslik"
              title={tr.home.campaignsTitle}
              action={{ href: ROUTES.campaigns, label: tr.common.seeAll }}
            />
            <CampaignStrip campaigns={campaigns} />
          </section>
        ) : null}

        {/* Patron isteği: etkinlik olmasa da takvim hep görünür; boşken "yakında eklenecek" yazar. */}
        <section id="etkinlikler" className="scroll-mt-16" aria-labelledby="etkinlikler-baslik">
          <SectionHeading
            id="etkinlikler-baslik"
            title={tr.events.title}
            subtitle={tr.events.subtitle}
          />
          <EventCalendar events={events} initialToday={today} />
        </section>

        {locations.length > 0 ? (
          <section id="mekanlar" className="scroll-mt-16" aria-labelledby="mekanlar-baslik">
            <SectionHeading
              id="mekanlar-baslik"
              title={tr.home.locationsTitle}
              subtitle={tr.home.locationsSubtitle}
            />
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
