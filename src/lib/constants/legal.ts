/**
 * KVKK aydınlatma metnindeki veri sorumlusu bilgileri. İşletmenin resmî unvanı ve adresi henüz
 * gelmedi: boş kalan alan sayfada hiç yazılmaz, uydurma bilgi basılmaz. Gelince buraya girilir.
 * Başvuru için telefon ve e-posta panelin Ayarlar sayfasından (SiteSettings) okunur.
 */
export const DATA_CONTROLLER: {
  /** Ticaret unvanı ya da şahıs işletmesinin sahibinin adı soyadı. */
  legalName: string | null
  /** Tebligat adresi. */
  address: string | null
  /** KEP adresi varsa. */
  kep: string | null
} = {
  legalName: null,
  address: null,
  kep: null,
}

/** Metnin son güncellendiği gün; metin değişince elle güncellenir. */
export const PRIVACY_UPDATED_AT = '6 Kasım 2026'
