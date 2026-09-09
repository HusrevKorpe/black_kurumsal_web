import type { SkeletonLocationSlug, SkeletonShopSlug } from './skeleton-data'

/**
 * Örnek (demo) içerik: iskeletteki mekan ve dükkanlar için uydurma ama gerçekçi ayrıntılar (açıklama, adres,
 * telefon, saat, özellik, fiyat listesi, görsel rengi) ve örnek kampanyalar. İki yerde kullanılır:
 *  - Yerel seed (`pnpm db:seed`): 5 dükkanın tamamını sıfırdan doldurur.
 *  - `pnpm content:demo`: canlıda seçili dükkanları (varsayılan `DEFAULT_DEMO_SHOP_SLUGS`) "örnek olsun" diye
 *    doldurur; yalnızca BOŞ dükkanlara yazar, panelden girilmiş içeriğe dokunmaz.
 * Telefon ve adresler gerçek değildir (0555 000 …, "Örnek Sokak"); patron panelden gerçeğini girer.
 */
export interface DemoHours {
  opensAt: string
  closesAt: string
}

export interface DemoPriceItem {
  name: string
  price: number | null
  unit?: string
  description?: string
  isFeatured?: boolean
}

export interface DemoPriceCategory {
  name: string
  description?: string
  items: DemoPriceItem[]
}

export interface DemoLocation {
  description?: string
  address?: string
  mapUrl?: string
  phone?: string
  whatsapp?: string
  /** Haftanın 7 günü aynı saat. */
  hours?: DemoHours
  /** Yer tutucu görsellerin rengi (HSL ton). */
  hue: number
}

export interface DemoShop {
  description: string
  address?: string
  phone?: string
  whatsapp?: string
  instagramUrl?: string
  features: string[]
  /** Boşsa mekandan devralır. */
  hours?: DemoHours
  priceCategories: DemoPriceCategory[]
  hue: number
}

interface DemoCampaignBase {
  title: string
  description: string
  ctaLabel?: string
  hue: number
}

export type DemoCampaign = DemoCampaignBase &
  (
    | { scope: 'GLOBAL' }
    | { scope: 'SHOP'; targetSlug: SkeletonShopSlug }
    | { scope: 'LOCATION'; targetSlug: SkeletonLocationSlug }
  )

/**
 * `pnpm content:demo` varsayılan kümesi: her dükkan türünden biri, Çarşı bölgesi ve Garden içinden bir
 * dükkan; böylece saat devralma, fiyat listesi türleri ve apart odaları tek bakışta görülür.
 */
export const DEFAULT_DEMO_SHOP_SLUGS = [
  'black-playstation-carsi',
  'black-tost-carsi',
  'black-tavuk-garden',
  'lavinya-apart',
] as const satisfies readonly SkeletonShopSlug[]

export const DEMO_LOCATIONS: Record<SkeletonLocationSlug, DemoLocation> = {
  'black-garden': {
    description: 'Tek çatı altında tavuk ve makarna. Geniş bahçeli oturma alanı, aile dostu ortam.',
    address: 'Garden Caddesi No: 1 (örnek adres, panelden güncellenecek)',
    mapUrl: 'https://maps.google.com/?q=Black+Garden',
    phone: '0555 000 00 01',
    whatsapp: '0555 000 00 01',
    hours: { opensAt: '11:00', closesAt: '23:30' },
    hue: 140,
  },
  carsi: { hue: 30 },
}

const DRINKS: DemoPriceCategory = {
  name: 'İçecekler',
  items: [
    { name: 'Çay', price: 15, unit: 'adet' },
    { name: 'Kola', price: 40, unit: 'adet' },
    { name: 'Ayran', price: 25, unit: 'adet' },
    { name: 'Su', price: 10, unit: 'adet' },
  ],
}

const playstationPrices = (): DemoPriceCategory[] => [
  {
    name: 'Oyun Ücretleri',
    items: [
      { name: 'PS5 Saatlik', price: 120, unit: 'saat', isFeatured: true },
      { name: 'PS4 Saatlik', price: 90, unit: 'saat' },
      { name: 'PS5 3 Saat Paketi', price: 320, unit: 'paket', description: 'Tek oturumda geçerli' },
    ],
  },
  {
    name: 'Oyunlar',
    description: 'Konsollarda yüklü popüler oyunlar',
    items: [
      { name: 'EA FC 26', price: null },
      { name: 'GTA V', price: null },
      { name: 'Mortal Kombat 1', price: null },
      { name: 'Tekken 8', price: null },
    ],
  },
  DRINKS,
]

const tostPrices = (): DemoPriceCategory[] => [
  {
    name: 'Tostlar',
    items: [
      { name: 'Kaşarlı Tost', price: 90, unit: 'porsiyon' },
      { name: 'Karışık Tost', price: 120, unit: 'porsiyon', isFeatured: true },
      { name: 'Sucuklu Tost', price: 130, unit: 'porsiyon' },
      {
        name: 'Black Special',
        price: 160,
        unit: 'porsiyon',
        description: 'Kaşar, sucuk, salam, sosis, domates',
      },
    ],
  },
  DRINKS,
]

const PS_FEATURES = ['PS5', '4K TV', '12 Konsol', 'Turnuva Geceleri']
const TOST_FEATURES = ['Odun Fırını', 'Paket Servis', 'Kahvaltı']

export const DEMO_SHOPS: Record<SkeletonShopSlug, DemoShop> = {
  'black-playstation-carsi': {
    description: 'Çarşı merkezinde PS5 ve PS4 konsollar, 4K ekranlar ve her cuma turnuva gecesi.',
    address: 'Çarşı Merkez, Örnek Sokak No: 5',
    phone: '0555 000 00 11',
    whatsapp: '0555 000 00 11',
    features: PS_FEATURES,
    hours: { opensAt: '10:00', closesAt: '02:00' },
    priceCategories: playstationPrices(),
    hue: 210,
  },
  'black-tost-carsi': {
    description: 'Odun fırınında hazırlanan tostlar, sabah kahvaltısı ve hızlı paket servis.',
    address: 'Çarşı Merkez, Örnek Sokak No: 9',
    phone: '0555 000 00 13',
    whatsapp: '0555 000 00 13',
    features: TOST_FEATURES,
    hours: { opensAt: '08:00', closesAt: '23:00' },
    priceCategories: tostPrices(),
    hue: 35,
  },
  'black-tavuk-garden': {
    description:
      'Izgara ve döner tavuk çeşitleri, kanat sepetleri ve menüler. Black Garden içinde.',
    features: ['Izgara', 'Menüler', 'Aile Boyu'],
    priceCategories: [
      {
        name: 'Menüler',
        items: [
          {
            name: 'Tavuk Döner Menü',
            price: 180,
            unit: 'porsiyon',
            isFeatured: true,
            description: 'Döner, patates, içecek',
          },
          { name: 'Izgara Tavuk Tabağı', price: 220, unit: 'porsiyon' },
          { name: 'Kanat Sepeti', price: 200, unit: 'porsiyon', description: '10 adet kanat, sos' },
        ],
      },
      { name: 'Ekstralar', items: [{ name: 'Patates Kızartması', price: 60, unit: 'porsiyon' }] },
    ],
    hue: 20,
  },
  'black-makarna-garden': {
    description: 'Taze soslarla hazırlanan İtalyan makarnalar. Black Garden içinde.',
    features: ['Taze Sos', 'Vejetaryen Seçenek'],
    priceCategories: [
      {
        name: 'Makarnalar',
        items: [
          { name: 'Alfredo', price: 190, unit: 'porsiyon' },
          { name: 'Bolonez', price: 200, unit: 'porsiyon', isFeatured: true },
          { name: 'Pesto', price: 210, unit: 'porsiyon' },
          { name: 'Napoliten', price: 170, unit: 'porsiyon' },
        ],
      },
    ],
    hue: 60,
  },
  'lavinya-apart': {
    description:
      'Şehir merkezine yakın, temiz ve güvenli günlük/haftalık konaklama. Tüm odalarda klima ve ücretsiz WiFi.',
    address: 'Lavinya Sokak No: 3 (örnek adres)',
    phone: '0555 000 00 31',
    whatsapp: '0555 000 00 31',
    features: ['Ücretsiz WiFi', 'Klima', 'Otopark', '24 Saat Resepsiyon'],
    hours: { opensAt: '00:00', closesAt: '00:00' },
    priceCategories: [
      {
        name: 'Oda Tipleri',
        items: [
          {
            name: 'Tek Kişilik Oda',
            price: 900,
            unit: 'gece',
            description: 'Tek kişilik yatak, mini buzdolabı, TV',
          },
          {
            name: 'Çift Kişilik Oda',
            price: 1400,
            unit: 'gece',
            isFeatured: true,
            description: 'Çift kişilik yatak, balkon',
          },
          {
            name: 'Aile Odası',
            price: 1900,
            unit: 'gece',
            description: '1 çift + 2 tek yatak, mutfak köşesi',
          },
        ],
      },
      {
        name: 'Ek Hizmetler',
        items: [
          { name: 'Ekstra Yatak', price: 300, unit: 'gece' },
          { name: 'Kahvaltı', price: 150, unit: 'kişi' },
        ],
      },
    ],
    hue: 290,
  },
}

export const DEMO_CAMPAIGNS: DemoCampaign[] = [
  {
    title: 'Black Garden Açıldı',
    description:
      'Tavuk ve makarna tek çatı altında. Açılış haftası boyunca tüm menülerde sürpriz ikramlar.',
    scope: 'GLOBAL',
    hue: 140,
    ctaLabel: 'Garden’ı Keşfet',
  },
  {
    title: 'Cuma Turnuva Gecesi',
    description: 'Her cuma 21:00’de EA FC 26 turnuvası. Kayıt için dükkana gel ya da WhatsApp yaz.',
    scope: 'SHOP',
    targetSlug: 'black-playstation-carsi',
    hue: 210,
  },
  {
    title: 'Hafta Sonu Aile Menüsü',
    description: 'Cumartesi ve pazar günleri Black Garden’da 4 kişilik aile menüsü.',
    scope: 'LOCATION',
    targetSlug: 'black-garden',
    hue: 30,
  },
]
