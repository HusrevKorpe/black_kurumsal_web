import {
  SKELETON_LOCATIONS,
  SKELETON_SHOPS,
  type SkeletonLocation,
  type SkeletonLocationSlug,
  type SkeletonShop,
  type SkeletonShopSlug,
} from '@/features/content/skeleton-data'

/**
 * Yerel geliştirme seed'i: gerçek iskeletin (ad/slug/tür/bağ) üstüne DEMO dolgu. Adres, telefon, saat,
 * fiyat ve görsel rengi örnektir; canlıya asla gitmez (canlıda yalnızca iskelet: `pnpm content:init`).
 */
export interface SeedHours {
  opensAt: string
  closesAt: string
}

export interface SeedPriceItem {
  name: string
  price: number | null
  unit?: string
  description?: string
  isFeatured?: boolean
}

export interface SeedPriceCategory {
  name: string
  description?: string
  items: SeedPriceItem[]
}

interface DemoLocation {
  description?: string
  address?: string
  mapUrl?: string
  phone?: string
  whatsapp?: string
  /** Haftanın 7 günü aynı saat. */
  hours?: SeedHours
  hue: number
}

interface DemoShop {
  description: string
  address?: string
  phone?: string
  whatsapp?: string
  instagramUrl?: string
  features: string[]
  /** Boşsa mekandan devralır. */
  hours?: SeedHours
  priceCategories: SeedPriceCategory[]
  hue: number
}

export type SeedLocation = SkeletonLocation & DemoLocation
export type SeedShop = SkeletonShop & DemoShop

const DEMO_LOCATIONS: Record<SkeletonLocationSlug, DemoLocation> = {
  'black-garden': {
    description:
      'Tek çatı altında tavuk, makarna, tost ve sushi. Geniş bahçeli oturma alanı, aile dostu ortam.',
    address: 'Garden Caddesi No: 1 (örnek adres, panelden güncellenecek)',
    mapUrl: 'https://maps.google.com/?q=Black+Garden',
    phone: '0555 000 00 01',
    whatsapp: '0555 000 00 01',
    hours: { opensAt: '11:00', closesAt: '23:30' },
    hue: 140,
  },
  carsi: { hue: 30 },
  iyas: { hue: 260 },
}

const DRINKS: SeedPriceCategory = {
  name: 'İçecekler',
  items: [
    { name: 'Çay', price: 15, unit: 'adet' },
    { name: 'Kola', price: 40, unit: 'adet' },
    { name: 'Ayran', price: 25, unit: 'adet' },
    { name: 'Su', price: 10, unit: 'adet' },
  ],
}

const playstationPrices = (): SeedPriceCategory[] => [
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

const internetCafePrices = (): SeedPriceCategory[] => [
  {
    name: 'Kullanım Ücretleri',
    items: [
      { name: '1 Saat', price: 60, unit: 'saat', isFeatured: true },
      { name: '3 Saat Paketi', price: 150, unit: 'paket' },
      { name: 'Gece Paketi', price: 250, unit: 'paket', description: '00:00 – 08:00 arası' },
    ],
  },
  {
    name: 'Çıktı ve Ofis',
    items: [
      { name: 'Siyah-Beyaz Çıktı', price: 5, unit: 'sayfa' },
      { name: 'Renkli Çıktı', price: 10, unit: 'sayfa' },
      { name: 'Tarama', price: 5, unit: 'sayfa' },
    ],
  },
  DRINKS,
]

const tostPrices = (): SeedPriceCategory[] => [
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
const NET_FEATURES = ['RTX Ekran Kartı', '144Hz Monitör', 'Fiber İnternet', 'Oyuncu Koltuğu']
const TOST_FEATURES = ['Odun Fırını', 'Paket Servis', 'Kahvaltı']

const DEMO_SHOPS: Record<SkeletonShopSlug, DemoShop> = {
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
  'black-internet-kafe-carsi': {
    description:
      'Yüksek performanslı oyun bilgisayarları, fiber internet ve rahat oyuncu koltukları.',
    address: 'Çarşı Merkez, Örnek Sokak No: 7',
    phone: '0555 000 00 12',
    features: NET_FEATURES,
    hours: { opensAt: '09:00', closesAt: '01:00' },
    priceCategories: internetCafePrices(),
    hue: 190,
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
  'black-playstation-iyas': {
    description: 'Iyaş bölgesinde geniş salon, PS5 konsollar ve grup oyun alanları.',
    address: 'Iyaş, Örnek Bulvarı No: 12',
    phone: '0555 000 00 21',
    whatsapp: '0555 000 00 21',
    features: ['PS5', '4K TV', '16 Konsol', 'Grup Salonu'],
    hours: { opensAt: '10:00', closesAt: '00:00' },
    priceCategories: playstationPrices(),
    hue: 220,
  },
  'black-internet-kafe-iyas': {
    description: 'Iyaş bölgesinde 30 bilgisayarlık salon, e-spor turnuvaları ve ofis hizmetleri.',
    address: 'Iyaş, Örnek Bulvarı No: 12',
    phone: '0555 000 00 22',
    features: NET_FEATURES,
    hours: { opensAt: '09:00', closesAt: '00:00' },
    priceCategories: internetCafePrices(),
    hue: 200,
  },
  'black-tost-iyas': {
    description: 'Iyaş bölgesinde tost, kahvaltı ve sıcak içecekler. Paket servis mevcut.',
    address: 'Iyaş, Örnek Bulvarı No: 14',
    phone: '0555 000 00 23',
    whatsapp: '0555 000 00 23',
    features: TOST_FEATURES,
    hours: { opensAt: '08:00', closesAt: '22:00' },
    priceCategories: tostPrices(),
    hue: 40,
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
  'black-tost-garden': {
    description: 'Black Garden içinde tost ve kahvaltı köşesi.',
    features: TOST_FEATURES,
    priceCategories: tostPrices(),
    hue: 45,
  },
  'black-sushi-garden': {
    description:
      'Günlük taze balıkla hazırlanan sushi setleri ve roll çeşitleri. Black Garden içinde.',
    features: ['Günlük Taze Balık', 'Set Menüler'],
    priceCategories: [
      {
        name: 'Sushi Setleri',
        items: [
          { name: "8'li Somon Set", price: 320, unit: 'set' },
          { name: "16'lı Karışık Set", price: 590, unit: 'set', isFeatured: true },
          { name: 'Vejetaryen Set', price: 260, unit: 'set' },
        ],
      },
      {
        name: "Roll'lar",
        items: [
          { name: 'California Roll', price: 180, unit: 'porsiyon' },
          { name: 'Philadelphia Roll', price: 210, unit: 'porsiyon' },
        ],
      },
    ],
    hue: 340,
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

export const SEED_LOCATIONS: SeedLocation[] = SKELETON_LOCATIONS.map((loc) => ({
  ...loc,
  ...DEMO_LOCATIONS[loc.slug],
}))

export const SEED_SHOPS: SeedShop[] = SKELETON_SHOPS.map((shop) => ({
  ...shop,
  ...DEMO_SHOPS[shop.slug],
}))

export interface SeedCampaign {
  title: string
  description: string
  scope: 'GLOBAL' | 'LOCATION' | 'SHOP'
  targetSlug?: string
  hue: number
  ctaLabel?: string
}

export const SEED_CAMPAIGNS: SeedCampaign[] = [
  {
    title: 'Black Garden Açıldı',
    description:
      'Tavuk, makarna, tost ve sushi tek çatı altında. Açılış haftası boyunca tüm menülerde sürpriz ikramlar.',
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

export const SEED_STAFF = {
  owner: {
    email: 'patron@black.local',
    fullName: 'Patron',
    password: process.env.SEED_OWNER_PASSWORD ?? 'Patron123!',
  },
  manager: {
    email: 'sorumlu@black.local',
    fullName: 'Çarşı Sorumlusu',
    password: process.env.SEED_MANAGER_PASSWORD ?? 'Sorumlu123!',
    shopSlugs: ['black-playstation-carsi', 'black-internet-kafe-carsi'],
  },
}
