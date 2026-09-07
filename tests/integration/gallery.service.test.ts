import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  addGalleryImages,
  removeGalleryImage,
  reorderGallery,
} from '@/features/media/gallery-service'
import { AuthorizationError } from '@/lib/auth/authorize'
import { db } from '@/lib/db'
import {
  createLocation,
  createManager,
  createMedia,
  createOwner,
  createShop,
  resetDatabase,
} from './helpers'

const removeObjects = vi.fn(async (_paths: string[]) => {})
vi.mock('@/features/media/storage', () => ({
  removeObjects: (paths: string[]) => removeObjects(paths),
  createSignedUpload: vi.fn(),
  objectExists: vi.fn(async () => true),
}))

beforeEach(async () => {
  await resetDatabase()
  removeObjects.mockClear()
})

describe('galeri', () => {
  it('dükkan medyasını galeriye ekler, sırayı devam ettirir', async () => {
    const shop = await createShop()
    const manager = await createManager([shop.id])
    const m1 = await createMedia(`shop/${shop.id}/1.webp`)
    const m2 = await createMedia(`shop/${shop.id}/2.webp`)
    expect(
      (await addGalleryImages(manager, { owner: { shopId: shop.id }, mediaIds: [m1.id] })).ok,
    ).toBe(true)
    expect(
      (await addGalleryImages(manager, { owner: { shopId: shop.id }, mediaIds: [m2.id] })).ok,
    ).toBe(true)
    const rows = await db.galleryImage.findMany({ orderBy: { sortOrder: 'asc' } })
    expect(rows.map((r) => r.sortOrder)).toEqual([0, 1])
  })

  it('başka dükkanın medyası veya zaten galerideki medya eklenemez', async () => {
    const shop = await createShop()
    const other = await createShop()
    const manager = await createManager([shop.id])
    const foreign = await createMedia(`shop/${other.id}/1.webp`)
    expect(
      (await addGalleryImages(manager, { owner: { shopId: shop.id }, mediaIds: [foreign.id] })).ok,
    ).toBe(false)
    const own = await createMedia(`shop/${shop.id}/1.webp`)
    await addGalleryImages(manager, { owner: { shopId: shop.id }, mediaIds: [own.id] })
    expect(
      (await addGalleryImages(manager, { owner: { shopId: shop.id }, mediaIds: [own.id] })).ok,
    ).toBe(false)
  })

  it('mekan galerisi yalnızca patrona açık', async () => {
    const location = await createLocation()
    const shop = await createShop()
    const manager = await createManager([shop.id])
    const media = await createMedia(`location/${location.id}/1.webp`)
    await expect(
      addGalleryImages(manager, { owner: { locationId: location.id }, mediaIds: [media.id] }),
    ).rejects.toBeInstanceOf(AuthorizationError)
    const owner = await createOwner()
    expect(
      (await addGalleryImages(owner, { owner: { locationId: location.id }, mediaIds: [media.id] }))
        .ok,
    ).toBe(true)
  })

  it('silme medya kaydını ve dosyayı kaldırır; kapaksa kapak boşalır', async () => {
    const shop = await createShop()
    const manager = await createManager([shop.id])
    const media = await createMedia(`shop/${shop.id}/1.webp`)
    await addGalleryImages(manager, { owner: { shopId: shop.id }, mediaIds: [media.id] })
    await db.shop.update({ where: { id: shop.id }, data: { coverImageId: media.id } })
    const image = await db.galleryImage.findFirstOrThrow()

    expect((await removeGalleryImage(manager, image.id)).ok).toBe(true)
    expect(await db.galleryImage.count()).toBe(0)
    expect(await db.media.count()).toBe(0)
    expect((await db.shop.findUniqueOrThrow({ where: { id: shop.id } })).coverImageId).toBeNull()
    expect(removeObjects).toHaveBeenCalledWith([media.path])
  })

  it('sıralama tam listeyle uygulanır', async () => {
    const shop = await createShop()
    const manager = await createManager([shop.id])
    const m1 = await createMedia(`shop/${shop.id}/1.webp`)
    const m2 = await createMedia(`shop/${shop.id}/2.webp`)
    await addGalleryImages(manager, { owner: { shopId: shop.id }, mediaIds: [m1.id, m2.id] })
    const [a, b] = await db.galleryImage.findMany({ orderBy: { sortOrder: 'asc' } })
    if (!a || !b) throw new Error('galeri')
    expect(
      (await reorderGallery(manager, { owner: { shopId: shop.id }, ids: [b.id, a.id] })).ok,
    ).toBe(true)
    const rows = await db.galleryImage.findMany({ orderBy: { sortOrder: 'asc' } })
    expect(rows.map((r) => r.id)).toEqual([b.id, a.id])
  })
})
