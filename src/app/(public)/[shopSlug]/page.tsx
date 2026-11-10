import { MessageCircleIcon, PhoneIcon } from 'lucide-react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CampaignCard } from '@/components/public/campaign-card'
import { ContactActionBar } from '@/components/public/contact-buttons'
import { DisplayName } from '@/components/public/display-name'
import { FeatureChips } from '@/components/public/feature-chips'
import { GameShelf } from '@/components/public/game-shelf'
import { Gallery } from '@/components/public/gallery'
import { HoursTable } from '@/components/public/hours-table'
import { OpenStatusBadge } from '@/components/public/open-status-badge'
import { PaftaCover } from '@/components/public/pafta/pafta-cover'
import { PaftaHero } from '@/components/public/pafta/pafta-hero'
import { PaftaStrip } from '@/components/public/pafta/pafta-strip'
import { paftaSideRows } from '@/components/public/pafta/side-rows'
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
import { DEFAULT_OG_IMAGE, pageDescription } from '@/lib/constants/site'
import { tr } from '@/lib/i18n/tr'
import { mediaPublicUrl } from '@/lib/media/url'
import { telHref, whatsappHref } from '@/lib/utils/format'
import { isReservedSlug } from '@/lib/utils/slugify'
import { hasContactCard, ShopContactCard } from './shop-contact-card'

export const revalidate = 3600
export const dynamicParams = true

const SECTION_TITLE_CLASS = 'pafta-heading pafta-heading-lg mb-[18px]'
/** Atlama şeridinden gelinen bölümün başlığı yapışkan üst çubuğun altında kalmasın. */
const SECTION_CLASS = 'min-w-0 scroll-mt-24 lg:col-start-1'

export async function generateStaticParams() {
  const slugs = await getActiveShopSlugs()
  return slugs.map((shopSlug) => ({ shopSlug }))
}

export async function generateMetadata({ params }: PageProps<'/[shopSlug]'>): Promise<Metadata> {
  const { shopSlug } = await params
  const shop = isReservedSlug(shopSlug) ? null : await getShopBySlug(shopSlug)
  if (!shop) return { title: tr.common.notFoundTitle }
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
        images: shop.coverImage ? [mediaPublicUrl(shop.coverImage)] : [DEFAULT_OG_IMAGE],
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
      images: shop.coverImage ? [mediaPublicUrl(shop.coverImage)] : [DEFAULT_OG_IMAGE],
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
  // Dükkanın kendi kampanyası ile bağlı olduğu mekânınki ayrı başlık altında: mekân kampanyası
  // "bu dükkana özel" değildir.
  const shopCampaigns = shop.campaigns
  const venueCampaigns = shop.location?.campaigns ?? []
  const venueName = shop.location?.name ?? null
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

  const tel = contact.phone ? telHref(contact.phone) : null
  const wa = contact.whatsapp ? whatsappHref(contact.whatsapp, whatsappMessage) : null
  // Boş bölüm sayfayı terk edilmiş gösterir: fiyat yoksa tek satır + "Fiyat için ara" (o da
  // yoksa hiç), saat yoksa saat bölümü hiç çıkmaz.
  const hasPrices = categories.length > 0
  const showPriceCall = !hasPrices && Boolean(tel || wa)
  const showPrices = hasPrices || showPriceCall
  const showHours = week.length > 0
  const showContact = hasContactCard(contact)
  const showGallery = gallery.length > 0
  const showAbout = Boolean(shop.description) || shop.features.length > 0
  // Şerit sayfadaki sırayla gider. "Fiyat için ara" kutusunun başlığı yok, oraya atlanmaz.
  const jumpLinks = [
    gameShelves[0] ? { href: `#vitrin-${gameShelves[0].id}`, label: tr.shop.games } : null,
    hasPrices ? { href: '#fiyatlar', label: tr.shop.prices } : null,
    showHours ? { href: '#saatler', label: tr.common.hours } : null,
    showContact ? { href: '#iletisim', label: tr.shop.contact } : null,
    showGallery ? { href: '#galeri', label: tr.shop.gallery } : null,
  ].filter((link) => link !== null)
  // Geniş ekranda sol sütunun satırları; boş satır (ve arasındaki boşluk) kalmasın.
  const leftSections = [
    showPrices,
    showGallery,
    showAbout,
    shopCampaigns.length > 0,
    venueCampaigns.length > 0 && Boolean(venueName),
  ].filter(Boolean).length
  const crumbs = [
    { href: ROUTES.home, label: tr.nav.home },
    ...(shop.location
      ? [{ href: ROUTES.location(shop.location.slug), label: shop.location.name }]
      : []),
  ]

  return (
    // data-accent dükkanın tabela rengini (shop-motion.css) sayfadaki bütün vurgulara yayar.
    <article className="pafta pb-16 md:pb-24" data-accent={SHOP_TYPE_META[shop.type].accent}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
      />

      <div className="mx-auto w-full max-w-7xl px-[18px] md:px-6 lg:px-12">
        <PaftaHero
          crumbs={crumbs}
          name={shop.name}
          morphSlug={shop.slug}
          subtitle={locationLabel ? `${typeLabel} · ${locationLabel}` : typeLabel}
          status={
            <OpenStatusBadge
              week={week}
              exceptions={exceptions}
              detailed
              omitTodayClose
              className="text-sm"
            />
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

        {/* Uzun sayfada (oyun vitrini, 40 kalemlik menü) aranan bölüme tek dokunuşla gidilsin. */}
        {jumpLinks.length >= 2 ? (
          <nav
            aria-label={tr.shop.sectionJump}
            className="-mx-[18px] mt-6 overflow-x-auto px-[18px] py-0.5 md:mx-0 md:mt-8 md:px-0.5"
          >
            <ul className="flex w-max gap-2 md:w-auto md:flex-wrap">
              {jumpLinks.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="pafta-jump">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        {/* Oyun dükkanında kapaklı oyun listesi fiyat listesinden ayrı, kendi vitrininde. */}
        {gamePlatform
          ? gameShelves.map((shelf) => (
              <section
                key={shelf.id}
                aria-labelledby={`vitrin-${shelf.id}`}
                className="mt-12 scroll-mt-24 md:mt-20"
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
          fiyata, sonra saate bakar. Geniş ekranda sağ sütun yapışkan yan panel; satır sayısı soldaki
          bölüm kadar, sonuncusu 1fr: panelin fazla yüksekliği bölümlerin arasına dağılmaz.
        */}
        <div
          className="mt-12 grid gap-12 md:mt-20 lg:grid-cols-[minmax(0,1fr)_360px] lg:grid-rows-(--side-rows) lg:gap-x-12 lg:gap-y-16"
          style={{ '--side-rows': paftaSideRows(leftSections) } as React.CSSProperties}
        >
          {hasPrices ? (
            <section aria-labelledby="fiyatlar" className={SECTION_CLASS}>
              <h2 id="fiyatlar" className={SECTION_TITLE_CLASS}>
                {tr.shop.prices}
              </h2>
              <PriceList categories={categories} />
            </section>
          ) : showPriceCall ? (
            <section
              id="fiyatlar"
              aria-label={tr.shop.prices}
              className={`${SECTION_CLASS} pafta-box flex flex-wrap items-center justify-between gap-4 p-4`}
            >
              <p className="text-[15px]">{tr.shop.pricesOnCall}</p>
              {tel ? (
                <a href={tel} data-track="call" className="pafta-btn pafta-btn-call">
                  <PhoneIcon aria-hidden /> {tr.shop.callForPrices}
                </a>
              ) : wa ? (
                <a
                  href={wa}
                  data-track="whatsapp"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="pafta-btn pafta-btn-wa"
                >
                  <MessageCircleIcon aria-hidden /> {tr.shop.pricesOnWhatsapp}
                </a>
              ) : null}
            </section>
          ) : null}

          {showHours || showContact ? (
            <aside className="grid content-start gap-10 lg:sticky lg:top-24 lg:col-start-2 lg:row-span-full lg:self-start">
              {showHours ? (
                <section aria-labelledby="saatler" className="scroll-mt-24">
                  <h2 id="saatler" className="pafta-heading mb-4">
                    {tr.common.hours}
                  </h2>
                  <div className="pafta-box p-4">
                    <HoursTable week={week} exceptions={exceptions} note={hoursNote} />
                  </div>
                </section>
              ) : null}
              <ShopContactCard contact={contact} venueName={venueName} />
            </aside>
          ) : null}

          {showGallery ? (
            <section aria-labelledby="galeri" className={SECTION_CLASS}>
              <h2 id="galeri" className={SECTION_TITLE_CLASS}>
                {tr.shop.gallery}
              </h2>
              <Gallery images={gallery} title={shop.name} />
            </section>
          ) : null}

          {showAbout ? (
            <section aria-labelledby="hakkinda" className={SECTION_CLASS}>
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

          {shopCampaigns.length > 0 ? (
            <section aria-labelledby="kampanyalar" className={SECTION_CLASS}>
              <h2 id="kampanyalar" className={SECTION_TITLE_CLASS}>
                {tr.shop.campaigns}
              </h2>
              <ul className="grid gap-3.5 sm:grid-cols-2">
                {shopCampaigns.map((campaign) => (
                  <li key={campaign.id} className="pafta-frame">
                    <CampaignCard campaign={campaign} hideTarget />
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {venueCampaigns.length > 0 && venueName ? (
            <section aria-labelledby="mekan-kampanyalari" className={SECTION_CLASS}>
              <h2 id="mekan-kampanyalari" className={SECTION_TITLE_CLASS}>
                {tr.shop.venueCampaigns(venueName)}
              </h2>
              <ul className="grid gap-3.5 sm:grid-cols-2">
                {venueCampaigns.map((campaign) => (
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
