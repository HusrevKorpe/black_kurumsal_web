import type { HoursExceptionEntry, WeeklyHours } from '@/features/hours'
import type { ShopType } from '@/generated/prisma/enums'
import { SITE_CITY } from '@/lib/constants/site'

const SCHEMA_TYPE: Record<ShopType, string> = {
  PLAYSTATION: 'EntertainmentBusiness',
  INTERNET_CAFE: 'InternetCafe',
  FOOD: 'FoodEstablishment',
  APART: 'LodgingBusiness',
  OTHER: 'LocalBusiness',
}

const SCHEMA_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const

export interface ShopJsonLdInput {
  name: string
  description: string | null
  url: string
  type: ShopType
  image: string | null
  phone: string | null
  address: string | null
  week: WeeklyHours
  exceptions?: readonly HoursExceptionEntry[]
  /** İçindeki dükkanlar (Black Garden gibi mekân): `containsPlace` olarak yazılır. */
  places?: readonly PlaceRef[]
}

/** Başka bir sayfaya bağlanan yer: yalnız ad ve adres. */
export interface PlaceRef {
  name: string
  url: string
}

function placeList(places: readonly PlaceRef[] | undefined) {
  return places && places.length > 0
    ? {
        containsPlace: places.map((place) => ({
          '@type': 'LocalBusiness',
          name: place.name,
          url: place.url,
        })),
      }
    : {}
}

function cityAddress(street: string | null) {
  // Sokak adresi girilmemiş olsa da şehir bilinir; Google işletmeyi doğru şehre bağlar.
  return {
    '@type': 'PostalAddress',
    ...(street ? { streetAddress: street } : {}),
    addressLocality: SITE_CITY,
    addressCountry: 'TR',
  }
}

/**
 * Özel günler `validFrom`/`validThrough` ile işaretlenir; Google haftalık kaydın yerine bunu
 * kullanır. Kapalı gün, saatleri 00:00–00:00 vererek bildirilir (schema.org'un kapalı gösterimi).
 */
function specialHoursSpecification(exceptions: readonly HoursExceptionEntry[]) {
  return exceptions.map((exception) => ({
    '@type': 'OpeningHoursSpecification',
    validFrom: exception.date,
    validThrough: exception.date,
    opens: exception.isClosed ? '00:00' : (exception.opensAt ?? '00:00'),
    closes: exception.isClosed ? '00:00' : (exception.closesAt ?? '00:00'),
  }))
}

/** schema.org LocalBusiness verisi; Google'ın işletme kartı için. */
export function buildShopJsonLd(input: ShopJsonLdInput): Record<string, unknown> {
  const openingHoursSpecification = input.week
    .filter((entry) => !entry.isClosed && entry.opensAt && entry.closesAt)
    .map((entry) => ({
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: `https://schema.org/${SCHEMA_DAYS[entry.dayOfWeek - 1]}`,
      opens: entry.opensAt,
      closes: entry.closesAt,
    }))

  return {
    '@context': 'https://schema.org',
    '@type': SCHEMA_TYPE[input.type],
    name: input.name,
    url: input.url,
    ...(input.description ? { description: input.description } : {}),
    ...(input.image ? { image: input.image } : {}),
    ...(input.phone ? { telephone: input.phone } : {}),
    address: cityAddress(input.address),
    ...(openingHoursSpecification.length > 0 ? { openingHoursSpecification } : {}),
    ...(input.exceptions && input.exceptions.length > 0
      ? { specialOpeningHoursSpecification: specialHoursSpecification(input.exceptions) }
      : {}),
    ...placeList(input.places),
  }
}

export interface DistrictJsonLdInput {
  name: string
  description: string | null
  url: string
  image: string | null
  places: readonly PlaceRef[]
}

/** Semt sayfası (Çarşı, Iyaş): tek adresi yok, içindeki dükkanları sayan bir yer. */
export function buildDistrictJsonLd(input: DistrictJsonLdInput): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: input.name,
    url: input.url,
    ...(input.description ? { description: input.description } : {}),
    ...(input.image ? { image: input.image } : {}),
    address: cityAddress(null),
    ...placeList(input.places),
  }
}

export interface OrganizationJsonLdInput {
  name: string
  siteUrl: string
  logo: string
  description: string
  phone: string | null
  email: string | null
  sameAs: readonly (string | null)[]
  places: readonly PlaceRef[]
}

/**
 * Ana sayfa: marka (Organization) ve site (WebSite) tek `@graph` içinde. Dükkanlar ve mekânlar
 * `subOrganization` olarak bağlanır; her birinin ayrıntısı kendi sayfasının verisindedir.
 */
export function buildOrganizationJsonLd(input: OrganizationJsonLdInput): Record<string, unknown> {
  const orgId = `${input.siteUrl}/#organization`
  const sameAs = input.sameAs.filter((url): url is string => Boolean(url))
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': orgId,
        name: input.name,
        url: input.siteUrl,
        logo: input.logo,
        description: input.description,
        ...(input.phone ? { telephone: input.phone } : {}),
        ...(input.email ? { email: input.email } : {}),
        ...(sameAs.length > 0 ? { sameAs } : {}),
        address: cityAddress(null),
        ...(input.places.length > 0
          ? {
              subOrganization: input.places.map((place) => ({
                '@type': 'LocalBusiness',
                name: place.name,
                url: place.url,
              })),
            }
          : {}),
      },
      {
        '@type': 'WebSite',
        '@id': `${input.siteUrl}/#website`,
        name: input.name,
        url: input.siteUrl,
        inLanguage: 'tr-TR',
        publisher: { '@id': orgId },
      },
    ],
  }
}

/** `</script>` enjeksiyonunu engellemek için `<` kaçırılır. */
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
