import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createCampaign, deleteCampaign, updateCampaign } from '@/features/campaigns/service'
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

const base = {
  title: 'Turnuva',
  description: '',
  ctaLabel: '',
  ctaUrl: '',
  startsAt: '',
  endsAt: '',
  isActive: true,
  sortOrder: 0,
}

beforeEach(async () => {
  await resetDatabase()
  removeObjects.mockClear()
})

describe('kampanyalar', () => {
  it('patron genel kampanya açar', async () => {
    const owner = await createOwner()
    const image = await createMedia(`campaign/${owner.id}/a.webp`)
    const result = await createCampaign(owner, {
      ...base,
      imageId: image.id,
      scope: 'GLOBAL',
      shopId: null,
      locationId: null,
    })
    expect(result.ok).toBe(true)
    expect(await db.auditLog.count({ where: { action: 'campaign.create' } })).toBe(1)
  })

  it('sorumlu yalnızca kendi dükkanı için SHOP kampanyası açar', async () => {
    const mine = await createShop()
    const other = await createShop()
    const manager = await createManager([mine.id])
    const image = await createMedia(`campaign/${manager.id}/a.webp`)
    await expect(
      createCampaign(manager, {
        ...base,
        imageId: image.id,
        scope: 'GLOBAL',
        shopId: null,
        locationId: null,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
    await expect(
      createCampaign(manager, {
        ...base,
        imageId: image.id,
        scope: 'SHOP',
        shopId: other.id,
        locationId: null,
      }),
    ).rejects.toBeInstanceOf(AuthorizationError)
    expect(
      (
        await createCampaign(manager, {
          ...base,
          imageId: image.id,
          scope: 'SHOP',
          shopId: mine.id,
          locationId: null,
        })
      ).ok,
    ).toBe(true)
  })

  it('sorumlu başkasının yüklediği görseli kullanamaz', async () => {
    const shop = await createShop()
    const manager = await createManager([shop.id])
    const owner = await createOwner()
    const image = await createMedia(`campaign/${owner.id}/a.webp`)
    const result = await createCampaign(manager, {
      ...base,
      imageId: image.id,
      scope: 'SHOP',
      shopId: shop.id,
      locationId: null,
    })
    expect(result.ok).toBe(false)
  })

  it('kapsam-hedef uyumsuzluğu alan hatası verir', async () => {
    const owner = await createOwner()
    const location = await createLocation()
    const image = await createMedia(`campaign/${owner.id}/a.webp`)
    const bad = await createCampaign(owner, {
      ...base,
      imageId: image.id,
      scope: 'LOCATION',
      shopId: null,
      locationId: null,
    })
    expect(bad.ok).toBe(false)
    const good = await createCampaign(owner, {
      ...base,
      imageId: image.id,
      scope: 'LOCATION',
      shopId: null,
      locationId: location.id,
    })
    expect(good.ok).toBe(true)
  })

  it('görsel değişince eski görsel silinir; kampanya silinince görseli de silinir', async () => {
    const owner = await createOwner()
    const first = await createMedia(`campaign/${owner.id}/1.webp`)
    const second = await createMedia(`campaign/${owner.id}/2.webp`)
    const created = await createCampaign(owner, {
      ...base,
      imageId: first.id,
      scope: 'GLOBAL',
      shopId: null,
      locationId: null,
    })
    if (!created.ok) throw new Error('kampanya')

    const updated = await updateCampaign(owner, created.data.id, {
      ...base,
      title: 'Yeni',
      imageId: second.id,
      scope: 'GLOBAL',
      shopId: null,
      locationId: null,
    })
    expect(updated.ok).toBe(true)
    expect(await db.media.findUnique({ where: { id: first.id } })).toBeNull()
    expect(removeObjects).toHaveBeenLastCalledWith([first.path])

    expect((await deleteCampaign(owner, created.data.id)).ok).toBe(true)
    expect(await db.campaign.count()).toBe(0)
    expect(await db.media.count()).toBe(0)
  })
})
