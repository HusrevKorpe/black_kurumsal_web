import { beforeEach, describe, expect, it } from 'vitest'
import { createEvent, deleteEvent, updateEvent } from '@/features/events/service'
import { getCalendarEvents } from '@/features/events/queries'
import { AuthorizationError } from '@/lib/auth/authorize'
import { db } from '@/lib/db'
import { createManager, createOwner, createShop, resetDatabase } from './helpers'

const base = {
  title: 'FC 26 Turnuvası',
  description: '',
  startsAt: '2026-11-20T17:00:00.000Z',
  endsAt: '',
  isActive: true,
}

beforeEach(async () => {
  await resetDatabase()
})

describe('etkinlikler', () => {
  it('patron genel etkinlik açar, takvimde görünür', async () => {
    const owner = await createOwner()
    const result = await createEvent(owner, { ...base, shopId: null })
    expect(result.ok).toBe(true)
    const events = await getCalendarEvents(new Date('2026-11-06T12:00:00Z'))
    expect(events).toHaveLength(1)
    expect(events[0]).toMatchObject({ title: 'FC 26 Turnuvası', shop: null })
    expect(await db.auditLog.count({ where: { action: 'event.create' } })).toBe(1)
  })

  it('başlangıç zorunlu, bitiş başlangıçtan önce olamaz', async () => {
    const owner = await createOwner()
    const noStart = await createEvent(owner, { ...base, shopId: null, startsAt: '' })
    expect(noStart.ok).toBe(false)
    const backwards = await createEvent(owner, {
      ...base,
      shopId: null,
      endsAt: '2026-11-19T17:00:00.000Z',
    })
    expect(backwards.ok).toBe(false)
  })

  it('sorumlu yalnız kendi dükkanına etkinlik açar', async () => {
    const own = await createShop()
    const other = await createShop()
    const manager = await createManager([own.id])
    expect((await createEvent(manager, { ...base, shopId: own.id })).ok).toBe(true)
    await expect(createEvent(manager, { ...base, shopId: other.id })).rejects.toThrow(
      AuthorizationError,
    )
    await expect(createEvent(manager, { ...base, shopId: null })).rejects.toThrow(
      AuthorizationError,
    )
  })

  it('sorumlu genel etkinliği düzenleyemez ve silemez', async () => {
    const owner = await createOwner()
    const shop = await createShop()
    const manager = await createManager([shop.id])
    const created = await createEvent(owner, { ...base, shopId: null })
    if (!created.ok) throw new Error('kurulum')
    await expect(
      updateEvent(manager, created.data.id, { ...base, shopId: shop.id }),
    ).rejects.toThrow(AuthorizationError)
    await expect(deleteEvent(manager, created.data.id)).rejects.toThrow(AuthorizationError)
    expect((await deleteEvent(owner, created.data.id)).ok).toBe(true)
  })

  it('gizli, eski ya da kapalı dükkanın etkinliği takvime çıkmaz', async () => {
    const owner = await createOwner()
    const shop = await createShop()
    await createEvent(owner, { ...base, shopId: null, isActive: false })
    await createEvent(owner, { ...base, shopId: null, startsAt: '2026-01-01T17:00:00.000Z' })
    await createEvent(owner, { ...base, shopId: shop.id })
    await db.shop.update({ where: { id: shop.id }, data: { isActive: false } })
    expect(await getCalendarEvents(new Date('2026-11-06T12:00:00Z'))).toEqual([])
  })
})
