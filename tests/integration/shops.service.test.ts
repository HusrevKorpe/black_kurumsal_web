import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuthorizationError } from '@/lib/auth/authorize'
import { db } from '@/lib/db'
import { createShop, deleteShop, setShopCover, updateShop } from '@/features/shops/service'
import {
  createManager,
  createMedia,
  createOwner,
  createShop as makeShop,
  resetDatabase,
  validShopInput,
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

describe('createShop', () => {
  it('patron dükkan oluşturur ve günlüğe yazılır', async () => {
    const owner = await createOwner()
    const result = await createShop(owner, validShopInput('yeni-dukkan'))
    expect(result.ok).toBe(true)
    const logs = await db.auditLog.findMany()
    expect(logs).toHaveLength(1)
    expect(logs[0]?.action).toBe('shop.create')
    expect(logs[0]?.staffId).toBe(owner.id)
  })

  it('sorumlu dükkan oluşturamaz', async () => {
    const manager = await createManager([])
    await expect(createShop(manager, validShopInput('x-dukkan'))).rejects.toBeInstanceOf(
      AuthorizationError,
    )
  })

  it('geçersiz slug alan hatası döner', async () => {
    const owner = await createOwner()
    const result = await createShop(owner, validShopInput('admin'))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.fieldErrors?.slug?.[0]).toMatch(/sistem/)
  })

  it('aynı slug ikinci kez eklenemez (benzersizlik)', async () => {
    const owner = await createOwner()
    await createShop(owner, validShopInput('tekrar'))
    await expect(createShop(owner, validShopInput('tekrar'))).rejects.toMatchObject({
      code: 'P2002',
    })
  })
})

describe('updateShop', () => {
  it('sorumlu kendi dükkanının içeriğini değiştirir ama slug/tür/aktiflik değişmez', async () => {
    const shop = await makeShop({ slug: 'ilk-slug' })
    const manager = await createManager([shop.id])
    const result = await updateShop(manager, shop.id, {
      ...validShopInput('kotu-niyetli-slug'),
      name: 'Yeni Ad',
      isActive: false,
      type: 'APART',
    })
    expect(result.ok).toBe(true)
    const updated = await db.shop.findUniqueOrThrow({ where: { id: shop.id } })
    expect(updated.name).toBe('Yeni Ad')
    expect(updated.slug).toBe('ilk-slug')
    expect(updated.type).toBe('FOOD')
    expect(updated.isActive).toBe(true)
  })

  it('sorumlu başka dükkanı değiştiremez', async () => {
    const mine = await makeShop()
    const other = await makeShop()
    const manager = await createManager([mine.id])
    await expect(updateShop(manager, other.id, validShopInput('x'))).rejects.toBeInstanceOf(
      AuthorizationError,
    )
  })

  it('patron slug ve aktifliği değiştirir', async () => {
    const shop = await makeShop({ slug: 'eski' })
    const owner = await createOwner()
    const result = await updateShop(owner, shop.id, { ...validShopInput('yeni'), isActive: false })
    expect(result.ok).toBe(true)
    const updated = await db.shop.findUniqueOrThrow({ where: { id: shop.id } })
    expect(updated.slug).toBe('yeni')
    expect(updated.isActive).toBe(false)
  })

  it('boş string alanlar null olarak saklanır', async () => {
    const shop = await makeShop()
    const owner = await createOwner()
    await updateShop(owner, shop.id, {
      ...validShopInput('bos-alanlar'),
      whatsapp: '',
      description: '   ',
    })
    const updated = await db.shop.findUniqueOrThrow({ where: { id: shop.id } })
    expect(updated.whatsapp).toBeNull()
    expect(updated.description).toBeNull()
  })
})

describe('setShopCover', () => {
  it('başka dükkanın görseli kapak yapılamaz', async () => {
    const shop = await makeShop()
    const other = await makeShop()
    const owner = await createOwner()
    const media = await createMedia(`shop/${other.id}/a.webp`)
    const result = await setShopCover(owner, shop.id, media.id)
    expect(result.ok).toBe(false)
  })

  it('kendi görseli kapak olur ve kaldırılır', async () => {
    const shop = await makeShop()
    const owner = await createOwner()
    const media = await createMedia(`shop/${shop.id}/a.webp`)
    expect((await setShopCover(owner, shop.id, media.id)).ok).toBe(true)
    expect((await db.shop.findUniqueOrThrow({ where: { id: shop.id } })).coverImageId).toBe(
      media.id,
    )
    expect((await setShopCover(owner, shop.id, null)).ok).toBe(true)
    expect((await db.shop.findUniqueOrThrow({ where: { id: shop.id } })).coverImageId).toBeNull()
  })
})

describe('deleteShop', () => {
  it('dükkanı siler; kayıt işaretlenir, içerik ve dosyalar yerinde kalır', async () => {
    const shop = await makeShop()
    const owner = await createOwner()
    const media = await createMedia(`shop/${shop.id}/g1.webp`)
    await db.galleryImage.create({ data: { mediaId: media.id, shopId: shop.id, sortOrder: 0 } })
    await db.openingHours.create({
      data: { shopId: shop.id, dayOfWeek: 1, opensAt: '09:00', closesAt: '18:00' },
    })

    const result = await deleteShop(owner, shop.id)
    expect(result.ok).toBe(true)
    const row = await db.shop.findUniqueOrThrow({ where: { id: shop.id } })
    expect(row.deletedAt).toBeInstanceOf(Date)
    expect(await db.galleryImage.count()).toBe(1)
    expect(await db.media.count()).toBe(1)
    expect(await db.openingHours.count()).toBe(1)
    expect(removeObjects).not.toHaveBeenCalled()
  })

  it('sorumlu silemez', async () => {
    const shop = await makeShop()
    const manager = await createManager([shop.id])
    await expect(deleteShop(manager, shop.id)).rejects.toBeInstanceOf(AuthorizationError)
  })

  it("silinmiş dükkanın slug'ı yeni dükkanda kullanılamaz, nedenini söyleyen hata döner", async () => {
    const owner = await createOwner()
    const shop = await makeShop({ slug: 'tavuk' })
    await deleteShop(owner, shop.id)
    const result = await createShop(owner, validShopInput('tavuk'))
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.error).toContain('silinmiş bir dükkanda')
  })
})
