import type { SkeletonShopSlug } from './skeleton-data'

/**
 * GERÇEK içerik: patronun gönderdiği fiyat listeleri ve çalışma saatleri. `demo-data.ts`'in tersidir —
 * buradaki hiçbir sayı uydurma değildir, her dükkanın `source` alanı bilginin nereden geldiğini yazar.
 * `pnpm content:real` bu veriyi veritabanına yazar (yerel ve canlı); dükkanın fiyat listesinin tamamını
 * buradakiyle DEĞİŞTİRİR, böylece demo fiyatları gerçeğinin yanında kalmaz.
 *
 * Yeni bir liste geldiğinde: dükkanı buraya ekle/güncelle, `source` satırını tarihiyle yaz, önce kuru
 * çalıştır (`pnpm content:real`), sonra `--apply` ile yaz. Fiyat panelden de düzenlenebilir; bu dosya
 * "patron ne gönderdi" kaydıdır, panelde sonradan yapılan düzeltmeleri geri almak için yeniden çalıştırma.
 */
export interface RealPriceItem {
  name: string
  /** null: fiyatsız bilgi satırı. */
  price: number | null
  /** "₺150 / saat" olarak yazılır. Yemek listelerinde boş bırakılır: "₺100" yeter. */
  unit?: string
  description?: string
}

export interface RealPriceCategory {
  name: string
  description?: string
  items: readonly RealPriceItem[]
}

/** Haftanın 7 günü aynı saat; farklı günler gerekirse panelden girilir. */
export interface RealWeekHours {
  opensAt: string
  closesAt: string
}

export interface RealShopContent {
  /** Bilgi nereden geldi: "tabela fotoğrafı, 2026-09-09" gibi. Uydurma veriyi ayırt etmenin tek yolu. */
  source: string
  hours?: RealWeekHours
  priceCategories?: readonly RealPriceCategory[]
}

const TOST_CARSI: RealShopContent = {
  source: 'Dükkan önündeki fiyat tabelası fotoğrafı (blacktostcarsifiyat.jpeg), 2026-09-09',
  priceCategories: [
    {
      name: 'Klasik Tostlar',
      items: [
        { name: 'Karışık', price: 100, description: 'Sucuk, kaşar, salça' },
        { name: 'Kaşarlı', price: 100, description: 'Kaşar, salça' },
        { name: 'Sucuklu', price: 100, description: 'Sucuk, salça' },
        {
          name: 'Akdeniz',
          price: 120,
          description: 'Süzme peynir, domates, yeşil biber, dilim zeytin, mısır',
        },
        { name: 'Yumurtalı', price: 120, description: 'Yumurta, kaşar, sucuk, salça' },
      ],
    },
    {
      name: 'Gurme Tostlar',
      items: [
        {
          name: 'Kavurmalı',
          price: 180,
          description: 'Kavurma, kaşar, kapya biber, çarliston biber, domates',
        },
        { name: 'Atom', price: 140, description: 'Yumurta, sucuk, kaşar, sosis, salça' },
        { name: 'Şinitzel', price: 140, description: 'Şinitzel, kaşar, turşu, ketçap, mayonez' },
        {
          name: 'Black Special',
          price: 150,
          description: 'Patates, sosis, sucuk, kaşar, turşu, ketçap, mayonez',
        },
        { name: 'Nutella', price: 110, description: 'Nutella, fındık parçacıkları' },
      ],
    },
    {
      name: 'Israrla Tavsiye',
      items: [
        { name: 'Köfte Ekmek', price: 170 },
        { name: 'Eritme Kumru', price: 140 },
        { name: 'Tavuk İncik', price: 160 },
        { name: 'Klasik Burger', price: 240 },
        { name: 'Tavuk Burger', price: 200 },
      ],
    },
    {
      name: 'Patsolar',
      description: '75₺ farkla bol malzemeli, 100₺ farkla menü. Bazlama seçeneği vardır.',
      items: [
        { name: 'Sade', price: 110, description: 'Patates, ketçap, mayonez, turşu' },
        { name: 'Sosisli', price: 140, description: 'Patates, sosis, ketçap, mayonez, turşu' },
        { name: 'Kaşarlı', price: 140, description: 'Patates, kaşar, ketçap, mayonez, turşu' },
        { name: 'Şinitzel', price: 140, description: 'Patates, şinitzel, ketçap, mayonez, turşu' },
        { name: 'Köfte', price: 170, description: 'Patates, köfte, ketçap, mayonez, turşu' },
        { name: 'Sucuklu', price: 140, description: 'Patates, sucuk, ketçap, mayonez, turşu' },
        {
          name: 'Karışık',
          price: 170,
          description: 'Patates, sosis, kaşar, şinitzel, ketçap, mayonez, turşu',
        },
      ],
    },
    {
      name: 'Kızartmalar',
      items: [
        { name: 'Duble Patates Tabağı', price: 100 },
        { name: 'Tek Patates Tabağı', price: 80 },
        {
          name: 'Karışık Kızartma Tabağı',
          price: 150,
          description: 'Patates, soğan halkası, şinitzel',
        },
        { name: "6'lı Soğan Halkası", price: 60 },
        { name: "6'lı Nuget", price: 60 },
      ],
    },
    {
      name: 'Gözlemeler',
      description: 'Domates, salatalık ve patates kızartması ile servis edilir.',
      items: [
        { name: 'Kaşarlı', price: 160 },
        { name: 'Peynirli', price: 160 },
        { name: 'Sucuklu', price: 160 },
        { name: 'Sucuk-Kaşar', price: 170 },
        { name: 'Pizza', price: 180 },
      ],
    },
    {
      name: 'İçecekler',
      items: [
        { name: 'Kutu Kola', price: 70 },
        { name: 'Şişe Kola', price: 50 },
        { name: 'Fanta', price: 50 },
        { name: 'Sprite', price: 50 },
        { name: 'Fuse Tea', price: 70 },
        { name: 'Ayran', price: 25 },
        { name: 'Su', price: 20 },
        { name: 'Çay', price: 20 },
      ],
    },
  ],
}

const PLAYSTATION_CARSI: RealShopContent = {
  source: 'Patronun mesajı (BlackPlaysatitonbilgi.png), 2026-09-09',
  hours: { opensAt: '09:00', closesAt: '02:00' },
  priceCategories: [
    {
      name: 'Oyun Ücretleri',
      items: [
        { name: 'PS5', price: 150, unit: 'saat' },
        { name: 'PS4', price: 130, unit: 'saat' },
      ],
    },
  ],
}

export const REAL_SHOP_CONTENT = {
  'black-playstation-carsi': PLAYSTATION_CARSI,
  'black-tost-carsi': TOST_CARSI,
} as const satisfies Partial<Record<SkeletonShopSlug, RealShopContent>>

export type RealShopSlug = keyof typeof REAL_SHOP_CONTENT

export const REAL_SHOP_SLUGS = Object.keys(REAL_SHOP_CONTENT) as readonly RealShopSlug[]
