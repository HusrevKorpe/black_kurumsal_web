import { randomUUID } from 'node:crypto'
import { db } from '@/lib/db'
import type { StaffContext } from '@/lib/auth/authorize'

/** Tüm tabloları boşaltır. Her testten önce çağrılır; testler birbirinden bağımsız kalır. */
export async function resetDatabase(): Promise<void> {
  // Emniyet: yalnızca test veritabanı boşaltılabilir. Yanlış URL ile geliştirme verisi silinmesin.
  if (!/black_test/.test(process.env.DATABASE_URL ?? '')) {
    throw new Error(
      `resetDatabase yalnızca black_test üzerinde çalışır (DATABASE_URL: ${process.env.DATABASE_URL})`,
    )
  }
  const tables = [
    'AuditLog',
    'StaffShopAssignment',
    'Campaign',
    'PriceItem',
    'PriceCategory',
    'GalleryImage',
    'OpeningHours',
    'Shop',
    'Location',
    'Media',
    'StaffUser',
    'SiteSettings',
  ]
  await db.$executeRawUnsafe(
    `TRUNCATE TABLE ${tables.map((t) => `"${t}"`).join(', ')} RESTART IDENTITY CASCADE`,
  )
}

export async function createOwner(): Promise<StaffContext> {
  const id = randomUUID()
  await db.staffUser.create({
    data: { id, email: `owner-${id}@test.local`, fullName: 'Patron', role: 'OWNER' },
  })
  return { id, role: 'OWNER', shopIds: [] }
}

export async function createManager(shopIds: string[]): Promise<StaffContext> {
  const id = randomUUID()
  await db.staffUser.create({
    data: {
      id,
      email: `manager-${id}@test.local`,
      fullName: 'Sorumlu',
      role: 'MANAGER',
      assignments: { create: shopIds.map((shopId) => ({ shopId })) },
    },
  })
  return { id, role: 'MANAGER', shopIds }
}

export async function createLocation(
  overrides: Partial<{ slug: string; name: string; kind: 'VENUE' | 'DISTRICT' }> = {},
) {
  const slug = overrides.slug ?? `loc-${randomUUID().slice(0, 8)}`
  return db.location.create({
    data: {
      slug,
      name: overrides.name ?? 'Test Mekan',
      kind: overrides.kind ?? 'VENUE',
      address: 'Adres 1',
      phone: '0555 000 00 01',
    },
  })
}

export async function createShop(
  overrides: Partial<{ slug: string; name: string; locationId: string | null }> = {},
) {
  const slug = overrides.slug ?? `shop-${randomUUID().slice(0, 8)}`
  return db.shop.create({
    data: {
      slug,
      name: overrides.name ?? 'Test Dükkan',
      type: 'FOOD',
      locationId: overrides.locationId ?? null,
    },
  })
}

export async function createMedia(path: string, overrides: Partial<{ createdAt: Date }> = {}) {
  return db.media.create({
    data: {
      path,
      mimeType: 'image/webp',
      sizeBytes: 1000,
      width: 100,
      height: 100,
      createdAt: overrides.createdAt,
    },
  })
}

export const validShopInput = (slug: string) => ({
  name: 'Yeni Dükkan',
  slug,
  type: 'FOOD',
  locationId: null,
  description: 'Açıklama',
  address: '',
  mapUrl: '',
  phone: '0555 111 11 11',
  whatsapp: '',
  instagramUrl: '',
  features: ['WiFi'],
  seoTitle: '',
  seoDescription: '',
  isActive: true,
  sortOrder: 3,
})
