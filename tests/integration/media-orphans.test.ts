import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanupOrphanMedia } from '@/features/media/orphans'
import { db } from '@/lib/db'
import { createMedia, createShop, resetDatabase } from './helpers'

type Stored = { path: string; createdAt: Date | null }
const removeObjects = vi.fn(async (_paths: string[]) => {})
const listAllObjects = vi.fn(async (): Promise<Stored[]> => [])
vi.mock('@/features/media/storage', () => ({
  removeObjects: (paths: string[]) => removeObjects(paths),
  listAllObjects: () => listAllObjects(),
  createSignedUpload: vi.fn(),
  objectExists: vi.fn(async () => true),
}))

const NOW = new Date('2026-09-07T12:00:00Z')
const OLD = new Date('2026-09-01T12:00:00Z')

beforeEach(async () => {
  await resetDatabase()
  removeObjects.mockClear()
  listAllObjects.mockReset()
  listAllObjects.mockResolvedValue([])
})

describe('yetim medya temizliği', () => {
  it('bağlı medyaya ve taze yüklemelere dokunmaz; eski yetimleri raporlar', async () => {
    const shop = await createShop()
    const cover = await createMedia(`shop/${shop.id}/cover.webp`, { createdAt: OLD })
    await db.shop.update({ where: { id: shop.id }, data: { coverImageId: cover.id } })
    const inGallery = await createMedia(`shop/${shop.id}/g1.webp`, { createdAt: OLD })
    await db.galleryImage.create({ data: { mediaId: inGallery.id, shopId: shop.id } })
    const campaignImage = await createMedia('campaign/x/c.webp', { createdAt: OLD })
    await db.campaign.create({
      data: { title: 'Kampanya', imageId: campaignImage.id, scope: 'GLOBAL' },
    })
    await createMedia(`shop/${shop.id}/fresh.webp`, { createdAt: NOW })
    const orphan = await createMedia(`shop/${shop.id}/orphan.webp`, { createdAt: OLD })
    listAllObjects.mockResolvedValue([
      { path: cover.path, createdAt: OLD },
      { path: orphan.path, createdAt: OLD },
      { path: `shop/${shop.id}/ghost.webp`, createdAt: OLD },
      { path: `shop/${shop.id}/uploading.webp`, createdAt: NOW },
      { path: `shop/${shop.id}/unknown-date.webp`, createdAt: null },
    ])

    const report = await cleanupOrphanMedia({ now: NOW })

    expect(report.dryRun).toBe(true)
    expect(report.orphanRows).toEqual([orphan.path])
    expect(report.orphanObjects).toEqual([`shop/${shop.id}/ghost.webp`])
    expect(report.deletedRows).toBe(0)
    expect(await db.media.count()).toBe(5)
    expect(removeObjects).not.toHaveBeenCalled()
    expect(await db.auditLog.count()).toBe(0)
  })

  it('uygulama modunda yetim satırları ve dosyaları siler, günlüğe yazar', async () => {
    const shop = await createShop()
    const orphan = await createMedia(`shop/${shop.id}/orphan.webp`, { createdAt: OLD })
    const kept = await createMedia(`shop/${shop.id}/cover.webp`, { createdAt: OLD })
    await db.shop.update({ where: { id: shop.id }, data: { coverImageId: kept.id } })
    const ghost = `shop/${shop.id}/ghost.webp`
    listAllObjects.mockResolvedValue([{ path: ghost, createdAt: OLD }])

    const report = await cleanupOrphanMedia({ dryRun: false, now: NOW })

    expect(report).toMatchObject({ deletedRows: 1, removedObjects: 2, orphanRows: [orphan.path] })
    expect(await db.media.findMany({ select: { id: true } })).toEqual([{ id: kept.id }])
    expect(removeObjects).toHaveBeenCalledWith([orphan.path, ghost])
    const log = await db.auditLog.findFirstOrThrow()
    expect(log.action).toBe('media.cleanup')
    expect(log.staffId).toBeNull()
    expect(log.data).toEqual({ rows: [orphan.path], objects: [ghost] })
  })

  it('bekleme süresi özelleştirilebilir', async () => {
    const shop = await createShop()
    await createMedia(`shop/${shop.id}/two-hours.webp`, {
      createdAt: new Date(NOW.getTime() - 2 * 3_600_000),
    })
    expect((await cleanupOrphanMedia({ now: NOW })).orphanRows).toEqual([])
    expect((await cleanupOrphanMedia({ now: NOW, graceHours: 1 })).orphanRows).toHaveLength(1)
  })

  it('silinecek bir şey yoksa günlüğe yazmaz ve depolamaya gitmez', async () => {
    const report = await cleanupOrphanMedia({ dryRun: false, now: NOW })
    expect(report).toMatchObject({ deletedRows: 0, removedObjects: 0 })
    expect(await db.auditLog.count()).toBe(0)
    expect(removeObjects).not.toHaveBeenCalled()
  })
})
