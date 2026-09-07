import { beforeEach, describe, expect, it, vi } from 'vitest'
import { deleteLocation } from '@/features/locations/service'
import { getActiveCampaigns } from '@/features/campaigns/queries'
import { getActiveShops, getShopBySlug } from '@/features/shops/queries'
import { listShopsForStaff } from '@/features/shops/admin-queries'
import { deleteShop } from '@/features/shops/service'
import { getTrashContents } from '@/features/trash/queries'
import { purgeLocation, purgeShop, restoreLocation, restoreShop } from '@/features/trash/service'
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

describe('çöp kutusundaki dükkan görünmez', () => {
  it('sitede ve panelde listelenmez, detay sayfası 404 verir', async () => {
    const owner = await createOwner()
    const shop = await createShop({ slug: 'gizli-dukkan' })
    await deleteShop(owner, shop.id)

    expect(await getActiveShops()).toHaveLength(0)
    expect(await getShopBySlug('gizli-dukkan')).toBeNull()
    expect(await listShopsForStaff(owner)).toHaveLength(0)
    expect((await getTrashContents()).shops.map((s) => s.slug)).toEqual(['gizli-dukkan'])
  })

  it('kampanyası sitede listelenmez, genel kampanya etkilenmez', async () => {
    const owner = await createOwner()
    const shop = await createShop()
    const image = await createMedia('campaign/x/1.webp')
    await db.campaign.create({
      data: { title: 'Dükkan kampanyası', imageId: image.id, scope: 'SHOP', shopId: shop.id },
    })
    const globalImage = await createMedia('campaign/x/2.webp')
    await db.campaign.create({
      data: { title: 'Genel kampanya', imageId: globalImage.id, scope: 'GLOBAL' },
    })

    expect(await getActiveCampaigns()).toHaveLength(2)
    await deleteShop(owner, shop.id)
    const remaining = await getActiveCampaigns()
    expect(remaining.map((c) => c.title)).toEqual(['Genel kampanya'])
  })

  it('sorumlunun ataması düşer: silinmiş dükkana erişimi kalmaz', async () => {
    const owner = await createOwner()
    const shop = await createShop()
    const manager = await createManager([shop.id])
    await deleteShop(owner, shop.id)

    const staff = await db.staffUser.findUniqueOrThrow({
      where: { id: manager.id },
      include: { assignments: { where: { shop: { deletedAt: null } }, select: { shopId: true } } },
    })
    expect(staff.assignments).toHaveLength(0)
  })
})

describe('restoreShop', () => {
  it('geri alınca site ve panele döner, adresi korunur', async () => {
    const owner = await createOwner()
    const shop = await createShop({ slug: 'geri-gelen' })
    await deleteShop(owner, shop.id)

    const result = await restoreShop(owner, shop.id)
    expect(result.ok).toBe(true)
    expect(await getShopBySlug('geri-gelen')).not.toBeNull()
    expect((await getTrashContents()).shops).toHaveLength(0)
    const logs = await db.auditLog.findMany({ where: { action: 'shop.restore' } })
    expect(logs).toHaveLength(1)
  })

  it('sorumlu geri alamaz', async () => {
    const shop = await createShop()
    const manager = await createManager([shop.id])
    await expect(restoreShop(manager, shop.id)).rejects.toBeInstanceOf(AuthorizationError)
  })
})

describe('purgeShop', () => {
  it('çöp kutusundakini kalıcı siler; medya kaydı ve dosya gider', async () => {
    const owner = await createOwner()
    const shop = await createShop()
    const media = await createMedia(`shop/${shop.id}/g1.webp`)
    await db.galleryImage.create({ data: { mediaId: media.id, shopId: shop.id, sortOrder: 0 } })
    await db.hoursException.create({
      data: { shopId: shop.id, date: new Date('2026-09-03T00:00:00.000Z'), isClosed: true },
    })
    await deleteShop(owner, shop.id)

    const result = await purgeShop(owner, shop.id)
    expect(result.ok).toBe(true)
    expect(await db.shop.count()).toBe(0)
    expect(await db.media.count()).toBe(0)
    expect(await db.hoursException.count()).toBe(0)
    expect(removeObjects).toHaveBeenCalledWith(expect.arrayContaining([media.path]))
  })

  it('çöp kutusunda olmayan dükkan kalıcı silinemez', async () => {
    const owner = await createOwner()
    const shop = await createShop()
    const result = await purgeShop(owner, shop.id)
    expect(result.ok).toBe(false)
    expect(await db.shop.count()).toBe(1)
    expect(removeObjects).not.toHaveBeenCalled()
  })
})

describe('mekan çöp kutusu', () => {
  it('canlı dükkanı olan mekan çöp kutusuna alınmaz', async () => {
    const owner = await createOwner()
    const location = await createLocation()
    await createShop({ locationId: location.id })

    const result = await deleteLocation(owner, location.id)
    expect(result.ok).toBe(false)
    expect(
      (await db.location.findUniqueOrThrow({ where: { id: location.id } })).deletedAt,
    ).toBeNull()
  })

  it('dükkanı çöp kutusundaysa mekan alınır ama kalıcı silinemez', async () => {
    const owner = await createOwner()
    const location = await createLocation()
    const shop = await createShop({ locationId: location.id })
    await deleteShop(owner, shop.id)

    expect((await deleteLocation(owner, location.id)).ok).toBe(true)
    const purge = await purgeLocation(owner, location.id)
    expect(purge.ok).toBe(false)
    expect(await db.location.count()).toBe(1)
  })

  it('boş mekan geri alınır ve kalıcı silinir', async () => {
    const owner = await createOwner()
    const location = await createLocation()
    await deleteLocation(owner, location.id)

    expect((await restoreLocation(owner, location.id)).ok).toBe(true)
    expect(
      (await db.location.findUniqueOrThrow({ where: { id: location.id } })).deletedAt,
    ).toBeNull()

    await deleteLocation(owner, location.id)
    expect((await purgeLocation(owner, location.id)).ok).toBe(true)
    expect(await db.location.count()).toBe(0)
  })
})
