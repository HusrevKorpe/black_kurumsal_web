import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CampaignCard } from '@/components/public/campaign-card'
import { ContactActionBar, hasActionBar } from '@/components/public/contact-buttons'
import { DisplayName } from '@/components/public/display-name'
import { FeatureChips } from '@/components/public/feature-chips'
import { GameShelf } from '@/components/public/game-shelf'
import { Gallery } from '@/components/public/gallery'
import { HoursTable } from '@/components/public/hours-table'
import { OpenStatusBadge } from '@/components/public/open-status-badge'
import { PaftaCover } from '@/components/public/pafta/pafta-cover'
import { PaftaHero } from '@/components/public/pafta/pafta-hero'
import { PaftaStrip } from '@/components/public/pafta/pafta-strip'
import { PriceList } from '@/components/public/price-list'
import { RenovationStage } from '@/components/public/renovation/renovation-stage'
import { resolveExceptions, resolveHours, toExceptionEntries } from '@/features/hours'
import { isGameShelf } from '@/features/pricing/games'
import { toPriceCategoryViews } from '@/features/pricing/view'
import { resolveContact } from '@/features/shops/contact'
import { buildShopJsonLd, serializeJsonLd } from '@/features/shops/json-ld'
import { getActiveShopSlugs, getShopBySlug } from '@/features/shops/queries'
import { isUnderRenovation } from '@/features/shops/renovation'
import { shopLocationLabel } from '@/features/shops/view'
import { publicEnv } from '@/lib/env'
import { ROUTES } from '@/lib/constants/routes'
import { SHOP_TYPE_META } from '@/lib/constants/shops'
import { pageDescription } from '@/lib/constants/site'
import { tr } from '@/lib/i18n/tr'
import { mediaPublicUrl } from '@/lib/media/url'
import { isReservedSlug } from '@/lib/utils/slugify'
import { ShopContactCard } from './shop-contact-card'

export const revalidate = 3600
export const dynamicParams = true

const SECTION_TITLE_CLASS = 'pafta-heading pafta-heading-lg mb-[18px]'

export async function generateStaticParams() {
  const slugs = await getActiveShopSlugs()
  return slugs.map((shopSlug) => ({ shopSlug }))
}

export async function generateMetadata({ params }: PageProps<'/[shopSlug]'>): Promise<Metadata> {
  const { shopSlug } = await params
  const shop = isReservedSlug(shopSlug) ? null : await getShopBySlug(shopSlug)
  if (!shop) return {}
  if (isUnderRenovation(shop.slug)) {
    const title = tr.renovation.metaTitle(shop.name)
    const description = tr.renovation.metaDescription(shop.name)
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
  const title = shop.seoTitle ?? shop.name
  const description =
    shop.seoDescription ??
    shop.description ??
    pageDescription(shop.name, SHOP_TYPE_META[shop.type].label)
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

  // Tadilattaki dükkanda fiyat, saat ve açık/kapalı yanıltır: sayfa tek ekranlık "Yakında" sahnesi.
  if (isUnderRenovation(shop.slug)) {
    return (
      <article data-accent={SHOP_TYPE_META[shop.type].accent}>
        <RenovationStage
          name={shop.name}
          slug={shop.slug}
          type={shop.type}
          cover={shop.coverImage}
          contact={resolveContact(shop, shop.location)}
        />
      </article>
    )
  }

  const { week, source } = resolveHours(shop.hours, shop.location?.hours)
  const exceptions = resolveExceptions(
    source,
    toExceptionEntries(shop.hoursExceptions),
    shop.location ? toExceptionEntries(shop.location.hoursExceptions) : null,
  )
  const contact = resolveContact(shop, shop.location)
  const allCategories = toPriceCategoryViews(shop.priceCategories)
  const gamePlatform = SHOP_TYPE_META[shop.type].gamePlatform
  // Oyun dükkanında kapaklı oyun listesi fiyat listesinden çıkar, kendi vitrininde afiş olarak durur.
  const gameShelves = gamePlatform ? allCategories.filter(isGameShelf) : []
  const categories = allCategories.filter((category) => !gameShelves.includes(category))
  const campaigns = [...shop.campaigns, ...(shop.location?.campaigns ?? [])]
  const gallery = shop.gallery.map((g) => ({
    id: g.id,
    url: mediaPublicUrl(g.media),
    // Panelde girilen açıklama önce gelir; yoksa yüklemedeki alt metin.
    alt: g.caption ?? g.media.alt ?? shop.name,
    caption: g.caption ?? g.media.alt,
  }))
  const typeLabel = SHOP_TYPE_META[shop.type].label
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

  const withBar = hasActionBar(contact)
  const crumbs = [
    { href: ROUTES.home, label: tr.nav.home },
    ...(shop.location
      ? [{ href: ROUTES.location(shop.location.slug), label: shop.location.name }]
      : []),
  ]

  return (
    // data-accent dükkanın tabela rengini (shop-motion.css) sayfadaki bütün vurgulara yayar.
    <article
      className={withBar ? 'pafta pb-28 md:pb-24' : 'pafta pb-16 md:pb-24'}
      data-accent={SHOP_TYPE_META[shop.type].accent}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      <div className="mx-auto w-full max-w-7xl px-[18px] md:px-12">
        <PaftaHero
          crumbs={crumbs}
          name={shop.name}
          morphSlug={shop.slug}
          subtitle={locationLabel ? `${typeLabel} · ${locationLabel}` : typeLabel}
          status={
            <OpenStatusBadge week={week} exceptions={exceptions} detailed className="text-sm" />
          }
          cover={
            shop.coverImage ? (
              <PaftaCover
                media={shop.coverImage}
                alt={shop.name}
                caption={locationLabel || typeLabel}
                galleryCount={gallery.length}
                morphSlug={shop.slug}
              />
            ) : null
          }
        />

        <PaftaStrip
          count={null}
          week={week}
          exceptions={exceptions}
          contact={contact}
          whatsappMessage={whatsappMessage}
        />

        {/* Oyun dükkanında kapaklı oyun listesi fiyat listesinden ayrı, kendi vitrininde. */}
        {gamePlatform
          ? gameShelves.map((shelf) => (
              <section
                key={shelf.id}
                aria-labelledby={`vitrin-${shelf.id}`}
                className="mt-12 md:mt-20"
              >
                <h2 id={`vitrin-${shelf.id}`} className={SECTION_TITLE_CLASS}>
                  <DisplayName>{shelf.name}</DisplayName>
                </h2>
                <GameShelf category={shelf} platform={gamePlatform} />
              </section>
            ))
          : null}

        {/*
          Telefonda sıra: fiyat, saat ve iletişim, galeri, hakkında, kampanyalar. Müşteri en çok
          fiyata, sonra saate bakar. Geniş ekranda sağ sütun yapışkan yan panel; son 1fr satırı
          panelin fazla yüksekliğini soldaki bölümlerin arasına dağıtmaz.
        */}
        <div className="mt-12 grid gap-12 md:mt-20 lg:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-[auto_auto_auto_auto_1fr] lg:gap-x-12 lg:gap-y-16">
          <section aria-labelledby="fiyatlar" className="min-w-0 lg:col-start-1">
            <h2 id="fiyatlar" className={SECTION_TITLE_CLASS}>
              {tr.shop.prices}
            </h2>
            <PriceList categories={categories} />
          </section>

          <aside className="grid content-start gap-10 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-5 lg:row-start-1 lg:self-start">
            <section aria-labelledby="saatler">
              <h2 id="saatler" className="pafta-heading mb-4">
                {tr.common.hours}
              </h2>
              <div className="pafta-box p-4">
                <HoursTable week={week} exceptions={exceptions} note={hoursNote} />
              </div>
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

          {shop.description || shop.features.length > 0 ? (
            <section aria-labelledby="hakkinda" className="min-w-0 lg:col-start-1">
              <h2 id="hakkinda" className={SECTION_TITLE_CLASS}>
                {tr.shop.about}
              </h2>
              {shop.description ? (
                <p className="max-w-2xl text-[17px] leading-relaxed whitespace-pre-line">
                  {shop.description}
                </p>
              ) : null}
              {shop.features.length > 0 ? (
                <div className={shop.description ? 'mt-5' : undefined}>
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
              <ul className="grid gap-3.5 sm:grid-cols-2">
                {campaigns.map((campaign) => (
                  <li key={campaign.id} className="pafta-frame">
                    <CampaignCard campaign={campaign} hideTarget />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>

      <ContactActionBar contact={contact} whatsappMessage={whatsappMessage} />
    </article>
  )
}
