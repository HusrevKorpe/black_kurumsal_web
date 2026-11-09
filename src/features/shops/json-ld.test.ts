import { describe, expect, it } from 'vitest'
import {
  buildDistrictJsonLd,
  buildOrganizationJsonLd,
  buildShopJsonLd,
  serializeJsonLd,
} from './json-ld'

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
    expect(data.address).toEqual({
      '@type': 'PostalAddress',
      streetAddress: 'Çarşı',
      addressLocality: 'Isparta',
      addressCountry: 'TR',
    })
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
    // Sokak adresi yoksa da şehir yazılır.
    expect(data.address).toEqual({
      '@type': 'PostalAddress',
      addressLocality: 'Isparta',
      addressCountry: 'TR',
    })
  })

  it('script kapanışını kaçırır', () => {
    expect(serializeJsonLd({ a: '</script>' })).toBe('{"a":"\\u003c/script>"}')
  })
})

describe('buildDistrictJsonLd', () => {
  it('semti Place olarak, dükkanlarını containsPlace ile yazar', () => {
    const data = buildDistrictJsonLd({
      name: 'Çarşı',
      description: null,
      url: 'https://black.example/mekan/carsi',
      image: null,
      places: [{ name: 'Black Tost Çarşı', url: 'https://black.example/black-tost-carsi' }],
    })
    expect(data['@type']).toBe('Place')
    expect(data).not.toHaveProperty('description')
    expect(data.containsPlace).toEqual([
      {
        '@type': 'LocalBusiness',
        name: 'Black Tost Çarşı',
        url: 'https://black.example/black-tost-carsi',
      },
    ])
  })
})

describe('buildOrganizationJsonLd', () => {
  it('marka ve siteyi tek grafikte yazar, boş bağlantıları atar', () => {
    const data = buildOrganizationJsonLd({
      name: 'Black',
      siteUrl: 'https://black.example',
      logo: 'https://black.example/apple-icon.png',
      description: 'Isparta',
      phone: null,
      email: null,
      sameAs: ['https://instagram.com/black', null],
      places: [],
    })
    const [org, site] = data['@graph'] as Record<string, unknown>[]
    expect(org?.['@type']).toBe('Organization')
    expect(org?.sameAs).toEqual(['https://instagram.com/black'])
    expect(org).not.toHaveProperty('telephone')
    expect(org).not.toHaveProperty('subOrganization')
    expect(site?.publisher).toEqual({ '@id': 'https://black.example/#organization' })
  })
})
