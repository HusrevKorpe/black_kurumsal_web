import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { CampaignCard } from '@/components/public/campaign-card'
import { ContactButtons } from '@/components/public/contact-buttons'
import { CoverImage } from '@/components/public/cover-image'
import { Gallery } from '@/components/public/gallery'
import { HoursTable } from '@/components/public/hours-table'
import { OpenStatusBadge } from '@/components/public/open-status-badge'
import { ShopCard } from '@/components/public/shop-card'
import { normalizeWeek } from '@/features/hours'
import { getActiveLocationSlugs, getLocationBySlug } from '@/features/locations/queries'
import { resolveContact } from '@/features/shops/contact'
import { ROUTES } from '@/lib/constants/routes'
import { tr } from '@/lib/i18n/tr'
import { mediaPublicUrl } from '@/lib/media/url'

export const revalidate = 3600
export const dynamicParams = true

export async function generateStaticParams() {
  const slugs = await getActiveLocationSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: PageProps<'/mekan/[slug]'>): Promise<Metadata> {
  const { slug } = await params
  const location = await getLocationBySlug(slug)
  if (!location) return {}
  return {
    title: location.name,
    description: location.description ?? undefined,
    alternates: { canonical: ROUTES.location(location.slug) },
    openGraph: {
      title: location.name,
      description: location.description ?? undefined,
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
  const contact = resolveContact(
    { phone: null, whatsapp: null, address: null, mapUrl: null, instagramUrl: null },
    location,
  )
  const gallery = location.gallery.map((g) => ({
    id: g.id,
    url: mediaPublicUrl(g.media),
    alt: g.media.alt ?? location.name,
  }))

  return (
    <article>
      {isVenue ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden sm:aspect-[21/9]">
          <CoverImage media={location.coverImage} alt={location.name} sizes="100vw" priority />
          <div
            className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent"
            aria-hidden
          />
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <header className={isVenue ? 'relative -mt-16 sm:-mt-24' : 'pt-10'}>
          <nav aria-label="Konum" className="mb-3 text-sm text-muted-foreground">
            <Link href={ROUTES.home} className="hover:text-foreground">
              {tr.nav.home}
            </Link>
          </nav>
          <Badge variant={isVenue ? 'default' : 'outline'}>
            {isVenue ? tr.location.venue : tr.location.district}
          </Badge>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{location.name}</h1>
          {location.description ? (
            <p className="mt-3 max-w-2xl leading-relaxed text-muted-foreground">
              {location.description}
            </p>
          ) : null}
          {isVenue ? <OpenStatusBadge week={week} detailed className="mt-3 text-sm" /> : null}
          {isVenue ? <ContactButtons contact={contact} className="mt-5" /> : null}
        </header>

        <div className="mt-10 space-y-12 pb-16">
          <section aria-labelledby="dukkanlar">
            <h2 id="dukkanlar" className="mb-4 text-xl font-semibold">
              {isVenue ? tr.location.shopsHere : tr.location.shopsInDistrict}
            </h2>
            {location.shops.length === 0 ? (
              <p className="text-sm text-muted-foreground">{tr.location.noShops}</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {location.shops.map((shop) => (
                  <ShopCard key={shop.id} shop={shop} hideLocation />
                ))}
              </div>
            )}
          </section>

          {isVenue ? (
            <div className="grid gap-10 lg:grid-cols-[1fr_340px]">
              <div className="space-y-12">
                {gallery.length > 0 ? (
                  <section aria-labelledby="galeri">
                    <h2 id="galeri" className="mb-3 text-xl font-semibold">
                      {tr.shop.gallery}
                    </h2>
                    <Gallery images={gallery} title={location.name} />
                  </section>
                ) : null}
                {location.campaigns.length > 0 ? (
                  <section aria-labelledby="kampanyalar">
                    <h2 id="kampanyalar" className="mb-3 text-xl font-semibold">
                      {tr.nav.campaigns}
                    </h2>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {location.campaigns.map((campaign) => (
                        <CampaignCard key={campaign.id} campaign={campaign} hideTarget />
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
              <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
                <section aria-labelledby="saatler" className="rounded-xl border bg-card p-4">
                  <h2 id="saatler" className="mb-3 font-semibold">
                    {tr.common.hours}
                  </h2>
                  <HoursTable week={week} />
                </section>
                {contact.address ? (
                  <section aria-labelledby="adres" className="rounded-xl border bg-card p-4">
                    <h2 id="adres" className="mb-2 font-semibold">
                      {tr.common.address}
                    </h2>
                    <p className="text-sm">{contact.address}</p>
                    {contact.mapUrl ? (
                      <a
                        href={contact.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-block text-sm text-brand hover:underline"
                      >
                        {tr.common.directions}
                      </a>
                    ) : null}
                  </section>
                ) : null}
              </aside>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  )
}
