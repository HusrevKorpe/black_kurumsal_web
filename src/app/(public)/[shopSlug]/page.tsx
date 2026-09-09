import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { CampaignCard } from '@/components/public/campaign-card'
import { ContactActionBar, ContactButtons } from '@/components/public/contact-buttons'
import { CoverBanner } from '@/components/public/cover-banner'
import { FeatureChips } from '@/components/public/feature-chips'
import { Gallery } from '@/components/public/gallery'
import { HoursTable } from '@/components/public/hours-table'
import { OpenStatusBadge } from '@/components/public/open-status-badge'
import { PriceList } from '@/components/public/price-list'
import { resolveExceptions, resolveHours, toExceptionEntries } from '@/features/hours'
import { toPriceCategoryViews } from '@/features/pricing/view'
import { resolveContact } from '@/features/shops/contact'
import { buildShopJsonLd, serializeJsonLd } from '@/features/shops/json-ld'
import { getActiveShopSlugs, getShopBySlug } from '@/features/shops/queries'
import { shopLocationLabel } from '@/features/shops/view'
import { publicEnv } from '@/lib/env'
import { ROUTES } from '@/lib/constants/routes'
import { SHOP_TYPE_META } from '@/lib/constants/shops'
import { tr } from '@/lib/i18n/tr'
import { mediaPublicUrl } from '@/lib/media/url'
import { isReservedSlug } from '@/lib/utils/slugify'
import { ShopContactCard } from './shop-contact-card'

export const revalidate = 3600
export const dynamicParams = true

/** 44 px'lik dokunma hedefi; eksi dikey boşluk metin satırının dışına taşan kısmı yutar. */
const BREADCRUMB_LINK_CLASS = '-my-3 inline-flex min-h-11 items-center hover:text-foreground'

export async function generateStaticParams() {
  const slugs = await getActiveShopSlugs()
  return slugs.map((shopSlug) => ({ shopSlug }))
}

export async function generateMetadata({ params }: PageProps<'/[shopSlug]'>): Promise<Metadata> {
  const { shopSlug } = await params
  const shop = isReservedSlug(shopSlug) ? null : await getShopBySlug(shopSlug)
  if (!shop) return {}
  const title = shop.seoTitle ?? shop.name
  const description = shop.seoDescription ?? shop.description ?? undefined
  return {
    title,
    description,
    alternates: { canonical: ROUTES.shop(shop.slug) },
    openGraph: {
      title,
      description,
      type: 'website',
      images: shop.coverImage ? [mediaPublicUrl(shop.coverImage)] : undefined,
    },
  }
}

export default async function ShopPage({ params }: PageProps<'/[shopSlug]'>) {
  const { shopSlug } = await params
  if (isReservedSlug(shopSlug)) notFound()
  const shop = await getShopBySlug(shopSlug)
  if (!shop) notFound()

  const { week, source } = resolveHours(shop.hours, shop.location?.hours)
  const exceptions = resolveExceptions(
    source,
    toExceptionEntries(shop.hoursExceptions),
    shop.location ? toExceptionEntries(shop.location.hoursExceptions) : null,
  )
  const contact = resolveContact(shop, shop.location)
  const categories = toPriceCategoryViews(shop.priceCategories)
  const campaigns = [...shop.campaigns, ...(shop.location?.campaigns ?? [])]
  const gallery = shop.gallery.map((g) => ({
    id: g.id,
    url: mediaPublicUrl(g.media),
    alt: g.media.alt ?? shop.name,
  }))
  const whatsappMessage = tr.shop.whatsappMessage(shop.name)
  const locationLabel = shopLocationLabel(shop.location)
  const hoursNote =
    source === 'location' && shop.location ? tr.shop.hoursFromVenue(shop.location.name) : undefined

  const jsonLd = buildShopJsonLd({
    name: shop.name,
    description: shop.description,
    url: `${publicEnv.NEXT_PUBLIC_SITE_URL}${ROUTES.shop(shop.slug)}`,
    type: shop.type,
    image: shop.coverImage ? mediaPublicUrl(shop.coverImage) : null,
    phone: contact.phone,
    address: contact.address,
    week,
    exceptions,
  })

  return (
    <article className="pb-28 md:pb-0">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      <CoverBanner media={shop.coverImage} alt={shop.name} />

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <header className="relative -mt-16 sm:-mt-24">
          <nav
            aria-label="Konum"
            className="mb-3 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"
          >
            <Link href={ROUTES.home} className={BREADCRUMB_LINK_CLASS}>
              {tr.nav.home}
            </Link>
            {shop.location ? (
              <>
                <span aria-hidden>/</span>
                <Link href={ROUTES.location(shop.location.slug)} className={BREADCRUMB_LINK_CLASS}>
                  {shop.location.name}
                </Link>
              </>
            ) : null}
          </nav>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{SHOP_TYPE_META[shop.type].label}</Badge>
            {locationLabel ? (
              <span className="text-sm text-muted-foreground">{locationLabel}</span>
            ) : null}
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">{shop.name}</h1>
          <OpenStatusBadge week={week} exceptions={exceptions} detailed className="mt-2 text-sm" />
          <ContactButtons
            contact={contact}
            whatsappMessage={whatsappMessage}
            className="mt-5"
            hasActionBar
          />
        </header>

        {/*
          Telefonda "açık mı, nerede" fiyat listesinden önce gelir: saat ve iletişim kartları
          DOM'da da önde. Geniş ekranda hücre yerleşimi açıkça verilir; sağ sütun yine yan panel.
        */}
        <div className="mt-8 grid gap-8 sm:mt-10 sm:gap-10 lg:grid-cols-[1fr_340px]">
          <aside className="space-y-6 lg:sticky lg:top-24 lg:col-start-2 lg:row-start-1 lg:self-start">
            <section aria-labelledby="saatler" className="rounded-xl border bg-card p-4">
              <h2 id="saatler" className="mb-3 font-semibold">
                {tr.common.hours}
              </h2>
              <HoursTable week={week} exceptions={exceptions} note={hoursNote} />
            </section>
            <ShopContactCard contact={contact} />
          </aside>

          <div className="space-y-12 lg:col-start-1 lg:row-start-1">
            {shop.description ? (
              <section aria-labelledby="hakkinda">
                <h2 id="hakkinda" className="mb-3 text-xl font-semibold">
                  {tr.shop.about}
                </h2>
                <p className="leading-relaxed whitespace-pre-line text-muted-foreground">
                  {shop.description}
                </p>
                {shop.features.length > 0 ? (
                  <div className="mt-4">
                    <FeatureChips features={shop.features} />
                  </div>
                ) : null}
              </section>
            ) : null}

            {gallery.length > 0 ? (
              <section aria-labelledby="galeri">
                <h2 id="galeri" className="mb-3 text-xl font-semibold">
                  {tr.shop.gallery}
                </h2>
                <Gallery images={gallery} title={shop.name} />
              </section>
            ) : null}

            <section aria-labelledby="fiyatlar">
              <h2 id="fiyatlar" className="mb-3 text-xl font-semibold">
                {tr.shop.prices}
              </h2>
              <PriceList categories={categories} />
            </section>

            {campaigns.length > 0 ? (
              <section aria-labelledby="kampanyalar">
                <h2 id="kampanyalar" className="mb-3 text-xl font-semibold">
                  {tr.shop.campaigns}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {campaigns.map((campaign) => (
                    <CampaignCard key={campaign.id} campaign={campaign} hideTarget />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        </div>
      </div>

      <ContactActionBar contact={contact} whatsappMessage={whatsappMessage} />
    </article>
  )
}
