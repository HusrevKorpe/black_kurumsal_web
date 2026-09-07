import type { WeeklyHours } from '@/features/hours'
import type { ShopType } from '@/generated/prisma/enums'

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
    ...(input.address
      ? { address: { '@type': 'PostalAddress', streetAddress: input.address } }
      : {}),
    ...(openingHoursSpecification.length > 0 ? { openingHoursSpecification } : {}),
  }
}

/** `</script>` enjeksiyonunu engellemek için `<` kaçırılır. */
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}
