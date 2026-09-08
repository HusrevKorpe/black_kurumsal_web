import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getActiveCampaigns } from '@/features/campaigns/queries'
import { listShopsForStaff } from '@/features/shops/admin-queries'
import { getActiveShops, getShopBySlug } from '@/features/shops/queries'
import { deleteShop } from '@/features/shops/service'
import { db } from '@/lib/db'
import { createManager, createMedia, createOwner, createShop, resetDatabase } from './helpers'

vi.mock('@/features/media/storage', () => ({
  removeObjects: vi.fn(async (_paths: string[]) => {}),
  createSignedUpload: vi.fn(),
  objectExists: vi.fn(async () => true),
}))

beforeEach(async () => {
  await resetDatabase()
})

/**
 * Silinen dükkan `deletedAt` ile işaretlenir, satır yerinde kalır. Bu blok kaydın gerçekten
 * her yoldan düştüğünü tek yerde kontrol eder: bir sorgu filtreyi unutursa burada yakalanır.
 */
describe('silinen dükkan hiçbir yerde görünmez', () => {
  it('sitede ve panelde listelenmez, detay sayfası 404 verir', async () => {
    const owner = await createOwner()
    const shop = await createShop({ slug: 'gizli-dukkan' })
    await deleteShop(owner, shop.id)

    expect(await getActiveShops()).toHaveLength(0)
    expect(await getShopBySlug('gizli-dukkan')).toBeNull()
    expect(await listShopsForStaff(owner)).toHaveLength(0)
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
