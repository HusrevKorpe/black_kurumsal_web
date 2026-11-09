export interface ContactFields {
  phone: string | null
  whatsapp: string | null
  address: string | null
  mapUrl: string | null
  instagramUrl: string | null
}

export type ContactSource = 'shop' | 'location' | null

export interface ResolvedContact extends ContactFields {
  /** Adres nereden geldi? Mekandan geldiyse sayfada "X içinde" yazılır. */
  addressSource: ContactSource
  /** Telefon ve WhatsApp mekandan geldiyse sayfada "X ortak hattı" yazılır. */
  phoneSource: ContactSource
  whatsappSource: ContactSource
}

function pick<K extends keyof ContactFields>(
  key: K,
  shop: ContactFields,
  location: ContactFields | null | undefined,
): { value: string | null; source: ContactSource } {
  if (shop[key]) return { value: shop[key], source: 'shop' }
  if (location?.[key]) return { value: location[key], source: 'location' }
  return { value: null, source: null }
}

/** Kural: dükkanda doluysa dükkanınki, boşsa mekanınki, o da boşsa yok. */
export function resolveContact(
  shop: ContactFields,
  location: ContactFields | null | undefined,
): ResolvedContact {
  const address = pick('address', shop, location)
  const phone = pick('phone', shop, location)
  const whatsapp = pick('whatsapp', shop, location)
  return {
    phone: phone.value,
    whatsapp: whatsapp.value,
    address: address.value,
    mapUrl: pick('mapUrl', shop, location).value,
    instagramUrl: pick('instagramUrl', shop, location).value,
    addressSource: address.source,
    phoneSource: phone.source,
    whatsappSource: whatsapp.source,
  }
}
