import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CampaignCard } from '@/components/public/campaign-card'
import { ContactActionBar, hasActionBar } from '@/components/public/contact-buttons'
import { Gallery } from '@/components/public/gallery'
import { HoursTable } from '@/components/public/hours-table'
import { OpenStatusBadge } from '@/components/public/open-status-badge'
import { PaftaCover } from '@/components/public/pafta/pafta-cover'
import { PaftaHero } from '@/components/public/pafta/pafta-hero'
import { PaftaStrip } from '@/components/public/pafta/pafta-strip'
import { PaftaShopTickets } from '@/components/public/pafta/pafta-tickets'
import { normalizeWeek, toExceptionEntries } from '@/features/hours'
import { getActiveLocationSlugs, getLocationBySlug } from '@/features/locations/queries'
import { resolveContact } from '@/features/shops/contact'
import { ROUTES } from '@/lib/constants/routes'
import { pageDescription } from '@/lib/constants/site'
import { tr } from '@/lib/i18n/tr'
import { mediaPublicUrl } from '@/lib/media/url'

export const revalidate = 3600
export const dynamicParams = true

const SECTION_TITLE_CLASS = 'pafta-heading pafta-heading-lg mb-[18px]'

export async function generateStaticParams() {
  const slugs = await getActiveLocationSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps<'/mekan/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const location = await getLocationBySlug(slug)
  if (!location) return {}
  const description =
    location.description ??
    pageDescription(
      location.name,
      location.kind === 'VENUE' ? tr.location.venue : tr.location.district,
    )
  return {
    title: location.name,
    description,
    alternates: { canonical: ROUTES.location(location.slug) },
    openGraph: {
      title: location.name,
      description,
      type: 'website',
      images: location.coverImage ? [mediaPublicUrl(location.coverImage)] : undefined,
    },
  }
}

export default async function LocationPage({ params }: PageProps<'/mekan/[slug]'>) {
  const { slug } = await params
  const location = await getLocationBySlug(slug)
  if (!location) notFound()

  const isVenue = location.kind === 'VENUE'
  const week = location.hours.length > 0 ? normalizeWeek(location.hours) : []
  const exceptions = week.length > 0 ? toExceptionEntries(location.hoursExceptions) : []
  const contact = resolveContact(
    { phone: null, whatsapp: null, address: null, mapUrl: null, instagramUrl: null },
    location,
  )
  const gallery = location.gallery.map((g) => ({
    id: g.id,
    url: mediaPublicUrl(g.media),
    alt: g.media.alt ?? location.name,
    caption: g.media.alt,
  }))
  const kindLabel = isVenue ? tr.location.venue : tr.location.district
  // Semt sayfası bir dizin: iletişim çubuğu yalnız tek adresli mekânda.
  const withBar = isVenue && hasActionBar(contact)

  return (
    // Mekân sayfası tabelanın yeşilini alır (Pafta kaynağı); içindeki biletler kendi dükkan rengindedir.
    <article
      className={withBar ? 'pafta pb-28 md:pb-24' : 'pafta pb-16 md:pb-24'}
      data-accent={isVenue ? 'grass' : undefined}
    >
      <div className="mx-auto w-full max-w-7xl px-[18px] md:px-12">
        <PaftaHero
          crumbs={[{ href: ROUTES.home, label: tr.nav.home }]}
          name={location.name}
          subtitle={kindLabel}
          lead={location.description}
          status={
            isVenue ? (
              <OpenStatusBadge week={week} exceptions={exceptions} detailed className="text-sm" />
            ) : null
          }
          cover={
            isVenue && location.coverImage ? (
              <PaftaCover
                media={location.coverImage}
                alt={location.name}
                caption={contact.address}
                galleryCount={gallery.length}
              />
            ) : null
          }
        />

        {isVenue ? (
          <PaftaStrip
            count={{ value: location.shops.length, label: tr.pafta.shops }}
            week={week}
            exceptions={exceptions}
            contact={contact}
          />
        ) : null}

        <section aria-labelledby="dukkanlar" className="mt-12 md:mt-20">
          <h2 id="dukkanlar" className={SECTION_TITLE_CLASS}>
            {isVenue ? tr.location.shopsHere : tr.location.shopsInDistrict}
          </h2>
          {location.shops.length === 0 ? (
            <p className="text-[var(--pafta-soft)]">{tr.location.noShops}</p>
          ) : (
            <PaftaShopTickets shops={location.shops} hideLocation />
          )}
        </section>

        {isVenue ? (
          // Telefonda tasarımdaki sıra: galeri, saatler, adres; geniş ekranda saatler sağda yapışkan sütun.
          <div className="mt-12 grid gap-12 md:mt-20 lg:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-[auto_auto_1fr] lg:gap-x-12 lg:gap-y-16">
            {gallery.length > 0 ? (
              <section aria-labelledby="galeri" className="min-w-0 lg:col-start-1 lg:row-start-1">
                <h2 id="galeri" className={SECTION_TITLE_CLASS}>
                  {tr.shop.gallery}
                </h2>
                <Gallery images={gallery} title={location.name} />
              </section>
            ) : null}
            <aside className="grid content-start gap-10 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-3 lg:row-start-1 lg:self-start">
              <section aria-labelledby="saatler">
                <h2 id="saatler" className="pafta-heading mb-4">
                  {tr.common.hours}
                </h2>
                <div className="pafta-box p-4">
                  <HoursTable week={week} exceptions={exceptions} />
                </div>
              </section>
              {contact.address ? (
                <section aria-labelledby="adres">
                  <h2 id="adres" className="pafta-heading mb-4">
                    {tr.common.address}
                  </h2>
                  <div className="pafta-box p-4 text-[15px]">
                    <p>{contact.address}</p>
                    {contact.mapUrl ? (
                      <a
                        href={contact.mapUrl}
                        data-track="directions"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="-mb-2 inline-flex min-h-12 items-center font-medium text-brand hover:underline"
                      >
                        {tr.common.directions}
                      </a>
                    ) : null}
                  </div>
                </section>
              ) : null}
            </aside>
            {location.campaigns.length > 0 ? (
              <section aria-labelledby="kampanyalar" className="min-w-0 lg:col-start-1">
                <h2 id="kampanyalar" className={SECTION_TITLE_CLASS}>
                  {tr.nav.campaigns}
                </h2>
                <ul className="grid gap-3.5 sm:grid-cols-2">
                  {location.campaigns.map((campaign) => (
                    <li key={campaign.id} className="pafta-frame">
                      <CampaignCard campaign={campaign} hideTarget />
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>
        ) : null}
      </div>

      {withBar ? <ContactActionBar contact={contact} /> : null}
    </article>
  )
}
