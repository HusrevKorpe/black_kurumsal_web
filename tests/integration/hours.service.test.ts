import { beforeEach, describe, expect, it } from 'vitest'
import { saveShopHours } from '@/features/hours/service'
import { db } from '@/lib/db'
import { createManager, createShop, resetDatabase } from './helpers'

const week = (useOwnHours: boolean) => ({
  useOwnHours,
  days: [1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => ({
    dayOfWeek,
    isClosed: dayOfWeek === 7,
    opensAt: '10:00',
    closesAt: '02:00',
  })),
})

beforeEach(async () => {
  await resetDatabase()
})

describe('saveShopHours', () => {
  it('7 günü kaydeder, kapalı günün saatlerini boşaltır', async () => {
    const shop = await createShop()
    const manager = await createManager([shop.id])
    const result = await saveShopHours(manager, shop.id, week(true))
    expect(result.ok).toBe(true)
    const rows = await db.openingHours.findMany({
      where: { shopId: shop.id },
      orderBy: { dayOfWeek: 'asc' },
    })
    expect(rows).toHaveLength(7)
    expect(rows[6]).toMatchObject({ dayOfWeek: 7, isClosed: true, opensAt: null, closesAt: null })
    expect(rows[0]).toMatchObject({ opensAt: '10:00', closesAt: '02:00' })
  })

  it('yeniden kaydetme eskiyi değiştirir (birikmez)', async () => {
    const shop = await createShop()
    const manager = await createManager([shop.id])
    await saveShopHours(manager, shop.id, week(true))
    await saveShopHours(manager, shop.id, week(true))
    expect(await db.openingHours.count({ where: { shopId: shop.id } })).toBe(7)
  })

  it('devralma seçilince kendi kaydı silinir', async () => {
    const shop = await createShop()
    const manager = await createManager([shop.id])
    await saveShopHours(manager, shop.id, week(true))
    const result = await saveShopHours(manager, shop.id, week(false))
    expect(result.ok).toBe(true)
    expect(await db.openingHours.count({ where: { shopId: shop.id } })).toBe(0)
  })

  it('bozuk girdi alan hatası döner ve hiçbir şey yazmaz', async () => {
    const shop = await createShop()
    const manager = await createManager([shop.id])
    const bad = week(true)
    bad.days[2] = {
      dayOfWeek: 3,
      isClosed: false,
      opensAt: '10:00',
      closesAt: null as unknown as string,
    }
    const result = await saveShopHours(manager, shop.id, bad)
    expect(result.ok).toBe(false)
    expect(await db.openingHours.count()).toBe(0)
  })
})
