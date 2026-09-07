import { describe, expect, it } from 'vitest'
import { buildShopJsonLd, serializeJsonLd } from './json-ld'

describe('buildShopJsonLd', () => {
  it('türü schema.org tipine çevirir ve saatleri yazar', () => {
    const data = buildShopJsonLd({
      name: 'Black Tost',
      description: 'Tost',
      url: 'https://black.example/black-tost',
      type: 'FOOD',
      image: 'https://cdn/x.webp',
      phone: '0555 000 00 13',
      address: 'Çarşı',
      week: [
        { dayOfWeek: 1, opensAt: '08:00', closesAt: '23:00', isClosed: false },
        { dayOfWeek: 2, opensAt: null, closesAt: null, isClosed: true },
      ],
    })
    expect(data['@type']).toBe('FoodEstablishment')
    expect(data.openingHoursSpecification).toEqual([
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'https://schema.org/Monday',
        opens: '08:00',
        closes: '23:00',
      },
    ])
    expect(data.address).toEqual({ '@type': 'PostalAddress', streetAddress: 'Çarşı' })
  })

  it('boş alanları hiç yazmaz', () => {
    const data = buildShopJsonLd({
      name: 'X',
      description: null,
      url: 'u',
      type: 'APART',
      image: null,
      phone: null,
      address: null,
      week: [],
    })
    expect(data['@type']).toBe('LodgingBusiness')
    expect(data).not.toHaveProperty('telephone')
    expect(data).not.toHaveProperty('openingHoursSpecification')
  })

  it('script kapanışını kaçırır', () => {
    expect(serializeJsonLd({ a: '</script>' })).toBe('{"a":"\\u003c/script>"}')
  })
})
