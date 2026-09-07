import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  createCategory,
  deleteCategory,
  reorderCategories,
} from '@/features/pricing/service-categories'
import { createItem, deleteItem, updateItem } from '@/features/pricing/service-items'
import { AuthorizationError } from '@/lib/auth/authorize'
import { db } from '@/lib/db'
import { createManager, createMedia, createShop, resetDatabase } from './helpers'

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

describe('fiyat listesi', () => {
  it('kategori ve kalem ekler; fiyat ondalık ve birim saklanır', async () => {
    const shop = await createShop()
    const manager = await createManager([shop.id])
    const category = await createCategory(manager, {
      shopId: shop.id,
      name: 'Oyun',
      description: '',
      isActive: true,
    })
    expect(category.ok).toBe(true)
    if (!category.ok) return
    const item = await createItem(manager, {
      categoryId: category.data.id,
      name: 'PS5',
      description: '',
      price: '120,50',
      unit: 'saat',
      isAvailable: true,
      isFeatured: true,
    })
    expect(item.ok).toBe(true)
    const saved = await db.priceItem.findFirstOrThrow()
    expect(saved.price?.toString()).toBe('120.5')
    expect(saved.unit).toBe('saat')
    expect(saved.sortOrder).toBe(0)
  })

  it('sorumlu başka dükkana kategori ekleyemez', async () => {
    const mine = await createShop()
    const other = await createShop()
    const manager = await createManager([mine.id])
    await expect(
      createCategory(manager, { shopId: other.id, name: 'X', description: '', isActive: true }),
    ).rejects.toBeInstanceOf(AuthorizationError)
  })

  it('kategori silinince kalemler ve görselleri gider', async () => {
    const shop = await createShop()
    const manager = await createManager([shop.id])
    const category = await createCategory(manager, {
      shopId: shop.id,
      name: 'Menü',
      description: '',
      isActive: true,
    })
    if (!category.ok) throw new Error('kategori')
    const media = await createMedia(`price-item/${shop.id}/x.webp`)
    const item = await createItem(manager, {
      categoryId: category.data.id,
      name: 'Tost',
      description: '',
      price: 90,
      unit: null,
      imageId: media.id,
      isAvailable: true,
      isFeatured: false,
    })
    expect(item.ok).toBe(true)

    const result = await deleteCategory(manager, category.data.id)
    expect(result.ok).toBe(true)
    expect(await db.priceItem.count()).toBe(0)
    expect(await db.media.count()).toBe(0)
    expect(removeObjects).toHaveBeenCalledWith([media.path])
  })

  it('başka dükkanın görseli kaleme bağlanamaz', async () => {
    const shop = await createShop()
    const other = await createShop()
    const manager = await createManager([shop.id])
    const category = await createCategory(manager, {
      shopId: shop.id,
      name: 'Menü',
      description: '',
      isActive: true,
    })
    if (!category.ok) throw new Error('kategori')
    const foreign = await createMedia(`price-item/${other.id}/x.webp`)
    await expect(
      createItem(manager, {
        categoryId: category.data.id,
        name: 'Tost',
        description: '',
        price: 90,
        unit: null,
        imageId: foreign.id,
        isAvailable: true,
        isFeatured: false,
      }),
    ).rejects.toThrow(/ait değil/)
  })

  it('görsel değiştirilince eski görsel silinir; kalem silinince görseli de silinir', async () => {
    const shop = await createShop()
    const manager = await createManager([shop.id])
    const category = await createCategory(manager, {
      shopId: shop.id,
      name: 'Menü',
      description: '',
      isActive: true,
    })
    if (!category.ok) throw new Error('kategori')
    const first = await createMedia(`price-item/${shop.id}/1.webp`)
    const second = await createMedia(`price-item/${shop.id}/2.webp`)
    const item = await createItem(manager, {
      categoryId: category.data.id,
      name: 'Tost',
      description: '',
      price: 90,
      unit: null,
      imageId: first.id,
      isAvailable: true,
      isFeatured: false,
    })
    if (!item.ok) throw new Error('kalem')

    await updateItem(manager, item.data.id, {
      name: 'Tost',
      description: '',
      price: 95,
      unit: null,
      imageId: second.id,
      isAvailable: true,
      isFeatured: false,
    })
    expect(await db.media.findUnique({ where: { id: first.id } })).toBeNull()
    expect(removeObjects).toHaveBeenLastCalledWith([first.path])

    await deleteItem(manager, item.data.id)
    expect(await db.media.count()).toBe(0)
    expect(removeObjects).toHaveBeenLastCalledWith([second.path])
  })

  it('sıralama listesi eksikse reddedilir, tamsa uygulanır', async () => {
    const shop = await createShop()
    const manager = await createManager([shop.id])
    const a = await createCategory(manager, {
      shopId: shop.id,
      name: 'A',
      description: '',
      isActive: true,
    })
    const b = await createCategory(manager, {
      shopId: shop.id,
      name: 'B',
      description: '',
      isActive: true,
    })
    if (!a.ok || !b.ok) throw new Error('kategori')
    expect((await reorderCategories(manager, shop.id, { ids: [a.data.id] })).ok).toBe(false)
    expect((await reorderCategories(manager, shop.id, { ids: [b.data.id, a.data.id] })).ok).toBe(
      true,
    )
    const rows = await db.priceCategory.findMany({ orderBy: { sortOrder: 'asc' } })
    expect(rows.map((r) => r.name)).toEqual(['B', 'A'])
  })
})
