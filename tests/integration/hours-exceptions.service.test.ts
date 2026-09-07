import { beforeEach, describe, expect, it } from 'vitest'
import {
  getOpenStatus,
  resolveExceptions,
  resolveHours,
  toExceptionEntries,
} from '@/features/hours'
import { deleteHoursException, saveHoursException } from '@/features/hours/service-exceptions'
import { saveShopHours } from '@/features/hours/service'
import { getShopBySlug } from '@/features/shops/queries'
import { AuthorizationError } from '@/lib/auth/authorize'
import { db } from '@/lib/db'
import { createLocation, createManager, createOwner, createShop, resetDatabase } from './helpers'

const openDaily = {
  useOwnHours: true,
  days: [1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => ({
    dayOfWeek,
    isClosed: false,
    opensAt: '09:00',
    closesAt: '23:00',
  })),
}

const closedDay = (date: string, note: string | null = null) => ({
  date,
  isClosed: true,
  opensAt: null,
  closesAt: null,
  note,
})

beforeEach(async () => {
  await resetDatabase()
})

describe('saveHoursException', () => {
  it('sorumlu kendi dükkanına özel gün ekler ve günlüğe yazılır', async () => {
    const shop = await createShop()
    const manager = await createManager([shop.id])

    const result = await saveHoursException(
      manager,
      { kind: 'shop', id: shop.id },
      closedDay('2026-09-03', 'Kurban Bayramı'),
    )
    expect(result.ok).toBe(true)

    const rows = await db.hoursException.findMany({ where: { shopId: shop.id } })
    expect(rows).toHaveLength(1)
    expect(rows[0]?.isClosed).toBe(true)
    expect(rows[0]?.note).toBe('Kurban Bayramı')
    expect(toExceptionEntries(rows)[0]?.date).toBe('2026-09-03')

    const logs = await db.auditLog.findMany({ where: { action: 'shop.hours.exception' } })
    expect(logs).toHaveLength(1)
  })

  it('aynı tarihe ikinci kayıt üzerine yazar, birikmez', async () => {
    const shop = await createShop()
    const manager = await createManager([shop.id])
    const owner = { kind: 'shop', id: shop.id } as const

    await saveHoursException(manager, owner, closedDay('2026-09-03'))
    await saveHoursException(manager, owner, {
      date: '2026-09-03',
      isClosed: false,
      opensAt: '10:00',
      closesAt: '14:00',
      note: 'Yarım gün',
    })

    const rows = await db.hoursException.findMany({ where: { shopId: shop.id } })
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({ isClosed: false, opensAt: '10:00', closesAt: '14:00' })
  })

  it('açık günde saat verilmezse reddedilir', async () => {
    const shop = await createShop()
    const manager = await createManager([shop.id])
    const result = await saveHoursException(
      manager,
      { kind: 'shop', id: shop.id },
      {
        date: '2026-09-03',
        isClosed: false,
        opensAt: null,
        closesAt: null,
        note: null,
      },
    )
    expect(result.ok).toBe(false)
    expect(await db.hoursException.count()).toBe(0)
  })

  it('olmayan tarih reddedilir', async () => {
    const shop = await createShop()
    const manager = await createManager([shop.id])
    const result = await saveHoursException(
      manager,
      { kind: 'shop', id: shop.id },
      closedDay('2026-02-31'),
    )
    expect(result.ok).toBe(false)
    expect(await db.hoursException.count()).toBe(0)
  })

  it('sorumlu başka dükkana ekleyemez', async () => {
    const mine = await createShop()
    const other = await createShop()
    const manager = await createManager([mine.id])
    await expect(
      saveHoursException(manager, { kind: 'shop', id: other.id }, closedDay('2026-09-03')),
    ).rejects.toBeInstanceOf(AuthorizationError)
  })

  it('mekana yalnızca patron ekler', async () => {
    const location = await createLocation()
    const manager = await createManager([])
    await expect(
      saveHoursException(manager, { kind: 'location', id: location.id }, closedDay('2026-09-03')),
    ).rejects.toBeInstanceOf(AuthorizationError)

    const owner = await createOwner()
    const result = await saveHoursException(
      owner,
      { kind: 'location', id: location.id },
      closedDay('2026-09-03'),
    )
    expect(result.ok).toBe(true)
  })
})

describe('deleteHoursException', () => {
  it('kaydı siler', async () => {
    const shop = await createShop()
    const manager = await createManager([shop.id])
    await saveHoursException(manager, { kind: 'shop', id: shop.id }, closedDay('2026-09-03'))
    const row = await db.hoursException.findFirstOrThrow({ where: { shopId: shop.id } })

    const result = await deleteHoursException(manager, { kind: 'shop', id: shop.id }, row.id)
    expect(result.ok).toBe(true)
    expect(await db.hoursException.count()).toBe(0)
  })

  it('başka dükkanın kaydını silemez', async () => {
    const mine = await createShop()
    const other = await createShop()
    const owner = await createOwner()
    await saveHoursException(owner, { kind: 'shop', id: other.id }, closedDay('2026-09-03'))
    const row = await db.hoursException.findFirstOrThrow({ where: { shopId: other.id } })

    const result = await deleteHoursException(owner, { kind: 'shop', id: mine.id }, row.id)
    expect(result.ok).toBe(false)
    expect(await db.hoursException.count()).toBe(1)
  })
})

describe('istisna gün siteye yansır', () => {
  it('kendi saatleri olan dükkan kendi istisnasını kullanır', async () => {
    const shop = await createShop({ slug: 'tavuk' })
    const owner = await createOwner()
    await saveShopHours(owner, shop.id, openDaily)
    await saveHoursException(
      owner,
      { kind: 'shop', id: shop.id },
      closedDay('2026-09-03', 'Bayram'),
    )

    const detail = await getShopBySlug('tavuk', new Date('2026-09-01T09:00:00Z'))
    expect(detail).not.toBeNull()
    const { week, source } = resolveHours(detail!.hours, detail!.location?.hours)
    const exceptions = resolveExceptions(source, toExceptionEntries(detail!.hoursExceptions), null)
    expect(exceptions.map((e) => e.date)).toEqual(['2026-09-03'])

    // 3 Eylül 12:00 İstanbul: haftalık tablo açık derdi, istisna kapatır
    expect(getOpenStatus(week, { now: new Date('2026-09-03T09:00:00Z'), exceptions })).toEqual({
      kind: 'closed',
      nextOpen: { dayOfWeek: 5, opensAt: '09:00' },
    })
  })

  it('saatleri devralan dükkan mekanın istisnasını devralır', async () => {
    const location = await createLocation()
    await createShop({ slug: 'sushi', locationId: location.id })
    const owner = await createOwner()
    await db.openingHours.createMany({
      data: [1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => ({
        locationId: location.id,
        dayOfWeek,
        opensAt: '09:00',
        closesAt: '23:00',
        isClosed: false,
      })),
    })
    await saveHoursException(owner, { kind: 'location', id: location.id }, closedDay('2026-09-03'))

    const detail = await getShopBySlug('sushi', new Date('2026-09-01T09:00:00Z'))
    const { source } = resolveHours(detail!.hours, detail!.location?.hours)
    expect(source).toBe('location')
    const exceptions = resolveExceptions(
      source,
      toExceptionEntries(detail!.hoursExceptions),
      toExceptionEntries(detail!.location?.hoursExceptions ?? []),
    )
    expect(exceptions.map((e) => e.date)).toEqual(['2026-09-03'])
  })

  it('geçmiş istisna sorguda taşınmaz', async () => {
    const shop = await createShop({ slug: 'tost' })
    const owner = await createOwner()
    await saveShopHours(owner, shop.id, openDaily)
    await saveHoursException(owner, { kind: 'shop', id: shop.id }, closedDay('2026-09-03'))

    const detail = await getShopBySlug('tost', new Date('2026-10-01T09:00:00Z'))
    expect(detail?.hoursExceptions).toHaveLength(0)
  })
})
