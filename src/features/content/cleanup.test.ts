import { describe, expect, it } from 'vitest'
import { buildCleanupPlan, type HourRow, type ShopRow } from './cleanup'
import { DEMO_LOCATIONS, DEMO_SHOPS } from './demo-data'

const week = (opensAt: string, closesAt: string): HourRow[] =>
  Array.from({ length: 7 }, (_, i) => ({ dayOfWeek: i + 1, opensAt, closesAt, isClosed: false }))

const demoPs = DEMO_SHOPS['black-playstation-carsi']
const demoApart = DEMO_SHOPS['lavinya-apart']

function shop(overrides: Partial<ShopRow> & Pick<ShopRow, 'slug'>): ShopRow {
  return {
    id: overrides.slug,
    name: overrides.slug,
    isActive: true,
    features: [],
    hours: [],
    priceCategories: [],
    ...overrides,
  }
}

describe('demo temizliği planı', () => {
  it('yalnızca demo değeriyle birebir aynı alanları boşaltır, gerçek telefona dokunmaz', () => {
    const plan = buildCleanupPlan({
      shops: [
        shop({
          slug: 'black-playstation-carsi',
          description: demoPs.description,
          address: demoPs.address,
          phone: '0555 0 132 132',
          whatsapp: '0555 0 132 132',
          features: [...demoPs.features],
          hours: week('09:00', '02:00'),
        }),
      ],
      locations: [],
      campaigns: [],
    })
    const ps = plan.shops[0]
    expect(ps?.cleared).toEqual({ description: demoPs.description, address: demoPs.address })
    expect(ps?.clearFeatures).toEqual(demoPs.features)
    // Gerçek saat (09–02) demo saatinden (10–02) farklı: kalır.
    expect(ps?.deleteHours).toBeNull()
    expect(ps?.hide).toBe(false)
  })

  it('demo saatini ve demo fiyat listesini kaldırır, panelde değişmiş kategoriyi bırakır', () => {
    const [rooms, extras] = demoApart.priceCategories
    const plan = buildCleanupPlan({
      shops: [
        shop({
          slug: 'lavinya-apart',
          hours: week('00:00', '00:00'),
          priceCategories: [
            {
              id: 'rooms',
              name: rooms?.name ?? '',
              isActive: true,
              items: (rooms?.items ?? []).map((item) => ({
                name: item.name,
                price: item.price === null ? null : { toString: () => `${item.price}.00` },
              })),
            },
            {
              id: 'extras',
              name: extras?.name ?? '',
              isActive: true,
              items: [{ name: 'Kahvaltı', price: { toString: () => '250.00' } }],
            },
          ],
        }),
      ],
      locations: [],
      campaigns: [],
    })
    expect(plan.shops[0]?.deleteHours).toBe('00:00–00:00')
    expect(plan.shops[0]?.hideCategories).toEqual([{ id: 'rooms', name: rooms?.name }])
  })

  it('mekanın demo bilgisini boşaltır ama mekanı gizlemez, demo kampanyaları kaldırır', () => {
    const garden = DEMO_LOCATIONS['black-garden']
    const plan = buildCleanupPlan({
      shops: [],
      locations: [
        {
          id: 'g',
          slug: 'black-garden',
          name: 'Black Garden',
          isActive: true,
          phone: garden.phone,
          address: garden.address,
          hours: week('11:00', '23:30'),
        },
      ],
      campaigns: [
        { id: 'c1', title: 'Cuma Turnuva Gecesi', isActive: true },
        { id: 'c2', title: 'Gerçek kampanya', isActive: true },
      ],
    })
    expect(plan.locations[0]?.hide).toBe(false)
    expect(plan.locations[0]?.cleared).toEqual({ phone: garden.phone, address: garden.address })
    expect(plan.locations[0]?.deleteHours).toBe('11:00–23:30')
    expect(plan.campaigns).toEqual([{ id: 'c1', title: 'Cuma Turnuva Gecesi' }])
  })

  it('ikinci çalıştırmada yapacak iş bulmaz', () => {
    const plan = buildCleanupPlan({
      shops: [
        shop({ slug: 'black-tost-carsi', phone: '0541 284 24 60' }),
        shop({ slug: 'lulu-kafe' }),
      ],
      locations: [],
      campaigns: [{ id: 'c1', title: 'Cuma Turnuva Gecesi', isActive: false }],
    })
    expect(plan).toEqual({ shops: [], locations: [], campaigns: [] })
  })
})
