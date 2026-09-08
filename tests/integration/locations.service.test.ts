import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createLocation, deleteLocation, updateLocation } from '@/features/locations/service'
import { AuthorizationError } from '@/lib/auth/authorize'
import { db } from '@/lib/db'
import {
  createManager,
  createMedia,
  createOwner,
  createLocation as makeLocation,
  createShop,
  resetDatabase,
} from './helpers'

const removeObjects = vi.fn(async (_paths: string[]) => {})
vi.mock('@/features/media/storage', () => ({
  removeObjects: (paths: string[]) => removeObjects(paths),
  createSignedUpload: vi.fn(),
  objectExists: vi.fn(async () => true),
}))

const input = (slug: string) => ({
  name: 'Black Garden',
  slug,
  kind: 'VENUE',
  description: '',
  address: 'Garden Cad. 1',
  mapUrl: '',
  phone: '0555 000 00 01',
  whatsapp: '',
  instagramUrl: '',
  isActive: true,
  sortOrder: 1,
})

beforeEach(async () => {
  await resetDatabase()
  removeObjects.mockClear()
})

describe('mekanlar', () => {
  it('yalnızca patron oluşturur ve günceller', async () => {
    const owner = await createOwner()
    const manager = await createManager([])
    await expect(createLocation(manager, input('garden'))).rejects.toBeInstanceOf(
      AuthorizationError,
    )
    const created = await createLocation(owner, input('garden'))
    expect(created.ok).toBe(true)
    if (!created.ok) return
    const updated = await updateLocation(owner, created.data.id, {
      ...input('garden'),
      name: 'Garden 2',
    })
    expect(updated.ok).toBe(true)
    expect((await db.location.findUniqueOrThrow({ where: { id: created.data.id } })).name).toBe(
      'Garden 2',
    )
  })

  it('içinde dükkan varken silinmez', async () => {
    const owner = await createOwner()
    const location = await makeLocation()
    await createShop({ locationId: location.id })
    const result = await deleteLocation(owner, location.id)
    expect(result.ok).toBe(false)
    expect(await db.location.count()).toBe(1)
  })

  it('boş mekan silinir; galerisi ve dosyaları yerinde kalır', async () => {
    const owner = await createOwner()
    const location = await makeLocation()
    const media = await createMedia(`location/${location.id}/1.webp`)
    await db.galleryImage.create({
      data: { mediaId: media.id, locationId: location.id, sortOrder: 0 },
    })
    const result = await deleteLocation(owner, location.id)
    expect(result.ok).toBe(true)
    const row = await db.location.findUniqueOrThrow({ where: { id: location.id } })
    expect(row.deletedAt).toBeInstanceOf(Date)
    expect(await db.media.count()).toBe(1)
    expect(removeObjects).not.toHaveBeenCalled()
  })
})
