import { describe, expect, it } from 'vitest'
import { resolveContact, type ContactFields } from './contact'

const empty: ContactFields = {
  phone: null,
  whatsapp: null,
  address: null,
  mapUrl: null,
  instagramUrl: null,
}
const garden: ContactFields = {
  phone: '0555 000 00 01',
  whatsapp: '0555 000 00 01',
  address: 'Garden Cad. No: 1',
  mapUrl: 'https://maps.google.com/?q=garden',
  instagramUrl: 'https://instagram.com/blackgarden',
}

describe('resolveContact', () => {
  it('dükkan boşsa mekandan devralır', () => {
    const result = resolveContact(empty, garden)
    expect(result.phone).toBe(garden.phone)
    expect(result.address).toBe(garden.address)
    expect(result.addressSource).toBe('location')
  })

  it('dükkanda dolu alan mekanı ezer, boş alan devralınır', () => {
    const result = resolveContact(
      { ...empty, phone: '0555 111 11 11', address: 'Kendi adresi' },
      garden,
    )
    expect(result.phone).toBe('0555 111 11 11')
    expect(result.whatsapp).toBe(garden.whatsapp)
    expect(result.address).toBe('Kendi adresi')
    expect(result.addressSource).toBe('shop')
  })

  it('mekan yoksa yalnız dükkan', () => {
    const result = resolveContact({ ...empty, phone: '0555 111 11 11' }, null)
    expect(result.phone).toBe('0555 111 11 11')
    expect(result.address).toBeNull()
    expect(result.addressSource).toBeNull()
  })

  it('boş string dolu sayılmaz', () => {
    const result = resolveContact({ ...empty, phone: '' }, garden)
    expect(result.phone).toBe(garden.phone)
  })
})
