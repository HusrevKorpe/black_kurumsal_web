import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CampaignCard } from '@/components/public/campaign-card'
import { ContactActionBar, ContactButtons } from '@/components/public/contact-buttons'
import { CoverImage } from '@/components/public/cover-image'
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
const BREADCRUMB_LINK_CLASS = 'inline-flex min-h-11 items-center hover:text-foreground'
const SECTION_TITLE_CLASS = 'mb-4 font-display text-4xl font-bold uppercase lg:text-5xl'

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

      {shop.coverImage ? (
        <div className="relative aspect-[16/10] w-full overflow-hidden lg:aspect-auto lg:h-[28rem]">
          <CoverImage media={shop.coverImage} alt={shop.name} sizes="100vw" priority />
          <div
            className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"
            aria-hidden
          />
        </div>
      ) : null}

      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <header className={shop.coverImage ? 'relative -mt-6 lg:-mt-16' : 'pt-4'}>
          <nav
            aria-label="Konum"
            className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground"
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
          <h1 className="mt-2 font-display text-5xl leading-[0.95] font-bold uppercase lg:text-8xl">
            {shop.name}
          </h1>
          <p className="mt-2 text-muted-foreground">
            {locationLabel
              ? `${SHOP_TYPE_META[shop.type].label} · ${locationLabel}`
              : SHOP_TYPE_META[shop.type].label}
          </p>
          <OpenStatusBadge week={week} exceptions={exceptions} detailed className="mt-1 text-sm" />
          <ContactButtons
            contact={contact}
            whatsappMessage={whatsappMessage}
            className="mt-4"
            hasActionBar
          />
        </header>

        {/*
          Telefonda sıra: fiyat, saat ve iletişim, galeri, hakkında. Müşteri en çok fiyata bakar;
          üstteki durum satırı "açık mı" sorusunu zaten cevaplar. Geniş ekranda sağ sütun yan panel,
          son 1fr satırı panelin fazla yüksekliğini soldaki bölümlerin arasına dağıtmaz.
        */}
        <div className="mt-8 grid gap-10 lg:mt-14 lg:grid-cols-[1fr_340px] lg:grid-rows-[auto_auto_auto_auto_1fr] lg:gap-x-16">
          <section aria-labelledby="fiyatlar" className="min-w-0 lg:col-start-1">
            <h2 id="fiyatlar" className={SECTION_TITLE_CLASS}>
              {tr.shop.prices}
            </h2>
            <PriceList categories={categories} />
          </section>

          <aside className="space-y-6 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-5 lg:row-start-1 lg:self-start">
            <section aria-labelledby="saatler" className="bg-card p-4">
              <h2 id="saatler" className="mb-3 font-display text-2xl font-bold uppercase">
                {tr.common.hours}
              </h2>
              <HoursTable week={week} exceptions={exceptions} note={hoursNote} />
            </section>
            <ShopContactCard contact={contact} />
          </aside>

          {gallery.length > 0 ? (
            <section aria-labelledby="galeri" className="min-w-0 lg:col-start-1">
              <h2 id="galeri" className={SECTION_TITLE_CLASS}>
                {tr.shop.gallery}
              </h2>
              <Gallery images={gallery} title={shop.name} />
            </section>
          ) : null}

          {shop.description ? (
            <section aria-labelledby="hakkinda" className="min-w-0 lg:col-start-1">
              <h2 id="hakkinda" className={SECTION_TITLE_CLASS}>
                {tr.shop.about}
              </h2>
              <p className="max-w-2xl leading-relaxed whitespace-pre-line text-muted-foreground">
                {shop.description}
              </p>
              {shop.features.length > 0 ? (
                <div className="mt-4">
                  <FeatureChips features={shop.features} />
                </div>
              ) : null}
            </section>
          ) : null}

          {campaigns.length > 0 ? (
            <section aria-labelledby="kampanyalar" className="min-w-0 lg:col-start-1">
              <h2 id="kampanyalar" className={SECTION_TITLE_CLASS}>
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

      <ContactActionBar contact={contact} whatsappMessage={whatsappMessage} />
    </article>
  )
}
