import { beforeEach, describe, expect, it } from 'vitest'
import { ensureContentSkeleton } from '@/features/content/skeleton'
import { SKELETON_SHOPS } from '@/features/content/skeleton-data'
import { applySync, isEmptyPlan, planSync } from '@/features/content/sync'
import { db } from '@/lib/db'
import { createLocation, createShop, resetDatabase } from './helpers'

beforeEach(resetDatabase)

describe('dükkan listesi eşitleme (applySync)', () => {
  it('eski yapıyı yeni listeye çevirir; içerik alanlarına dokunmaz, çöpteki kaydı geri getirmez', async () => {
    // Eylül 2026 canlı yapısı: Garden'da iki dükkan, Iyaş ve şubeleri çöpte.
    const carsi = await createLocation({ slug: 'carsi', name: 'Çarşı', kind: 'DISTRICT' })
    const garden = await createLocation({
      slug: 'black-garden',
      name: 'Black Garden',
      kind: 'VENUE',
    })
    const iyas = await createLocation({ slug: 'iyas', name: 'Iyaş', kind: 'DISTRICT' })
    await db.location.update({ where: { id: iyas.id }, data: { deletedAt: new Date() } })
    const tost = await createShop({
      slug: 'black-tost-carsi',
      name: 'Black Tost Çarşı',
      locationId: carsi.id,
    })
    await db.shop.update({
      where: { id: tost.id },
      data: { phone: '0541 284 24 60', sortOrder: 3 },
    })
    const lavinya = await createShop({ slug: 'lavinya-apart', name: 'Lavinya Apart' })
    const tavuk = await createShop({
      slug: 'black-tavuk-garden',
      name: 'Black Tavuk',
      locationId: garden.id,
    })
    const eskiTost = await createShop({
      slug: 'black-tost-iyas',
      name: 'Black Tost Iyaş',
      locationId: iyas.id,
    })
    await db.shop.update({
      where: { id: eskiTost.id },
      data: { deletedAt: new Date(), phone: '0555 000 00 23' },
    })

    const plan = await applySync(db)
    expect(plan.shops.remove.map((r) => r.slug)).toEqual(['black-tavuk-garden'])
    expect(plan.shops.archive.map((r) => r.slug)).toEqual(['black-tost-iyas'])
    expect(plan.locations.archive.map((r) => r.slug)).toEqual(['iyas'])

    const live = await db.shop.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: 'asc' },
      include: { location: { select: { slug: true } } },
    })
    expect(live.map((s) => [s.slug, s.location?.slug ?? null])).toEqual(
      SKELETON_SHOPS.map((s) => [s.slug, s.locationSlug]),
    )
    // Var olan kaydın kimliği ve içeriği korunur; yalnızca yapı alanları değişir.
    expect(live.find((s) => s.slug === 'black-tost-carsi')).toMatchObject({
      id: tost.id,
      phone: '0541 284 24 60',
    })
    expect(live.find((s) => s.slug === 'lavinya-apart')).toMatchObject({
      id: lavinya.id,
      locationId: carsi.id,
    })
    // Yeni Iyaş şubesi boş açılır; eski demo kaydı çöpte, slug'ı boşaltılmış hâlde durur.
    expect(live.find((s) => s.slug === 'black-tost-iyas')).toMatchObject({ phone: null })
    expect(await db.shop.findUniqueOrThrow({ where: { id: eskiTost.id } })).toMatchObject({
      slug: expect.stringMatching(/^black-tost-iyas-eski-/),
      phone: '0555 000 00 23',
    })
    expect((await db.shop.findUniqueOrThrow({ where: { id: tavuk.id } })).deletedAt).not.toBeNull()
    expect(
      (await db.location.findUniqueOrThrow({ where: { slug: 'black-garden' } })).deletedAt,
    ).toBeNull()

    const logs = await db.auditLog.findMany({ where: { action: 'content.sync' } })
    expect(logs).toHaveLength(1)
    expect(isEmptyPlan(await planSync(db))).toBe(true)
  })

  it('iskeletle kurulmuş veritabanında yapacak iş bulmaz ve günlüğe yazmaz', async () => {
    await ensureContentSkeleton(db)
    expect(isEmptyPlan(await applySync(db))).toBe(true)
    expect(await db.auditLog.count({ where: { action: 'content.sync' } })).toBe(0)
  })
})
