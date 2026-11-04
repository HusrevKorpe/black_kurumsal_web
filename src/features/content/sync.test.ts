import { describe, expect, it } from 'vitest'
import { SKELETON_LOCATIONS, SKELETON_SHOPS } from './skeleton-data'
import {
  archivedSlug,
  buildSyncPlan,
  isEmptyPlan,
  type ExistingLocation,
  type ExistingShop,
} from './sync'

const loc = (slug: string, over: Partial<ExistingLocation> = {}): ExistingLocation => {
  const want = SKELETON_LOCATIONS.find((l) => l.slug === slug)
  return {
    id: `id-${slug}`,
    slug,
    name: want?.name ?? slug,
    kind: want?.kind ?? 'DISTRICT',
    sortOrder: want?.sortOrder ?? 0,
    deletedAt: null,
    ...over,
  }
}

const shop = (slug: string, over: Partial<ExistingShop> = {}): ExistingShop => {
  const want = SKELETON_SHOPS.find((s) => s.slug === slug)
  return {
    id: `id-${slug}`,
    slug,
    name: want?.name ?? slug,
    type: want?.type ?? 'FOOD',
    sortOrder: want?.sortOrder ?? 0,
    deletedAt: null,
    location: want?.locationSlug ? { slug: want.locationSlug } : null,
    ...over,
  }
}

const inSync = () => ({
  locations: SKELETON_LOCATIONS.map((l) => loc(l.slug)),
  shops: SKELETON_SHOPS.map((s) => shop(s.slug)),
})

describe('buildSyncPlan', () => {
  it('iskeletle aynı veritabanında yapılacak iş yoktur', () => {
    expect(isEmptyPlan(buildSyncPlan(inSync()))).toBe(true)
  })

  it('listede olmayan yayındaki dükkan silinir, zaten silinmiş olana dokunulmaz', () => {
    const state = inSync()
    state.shops.push(shop('black-tavuk-garden', { location: { slug: 'black-garden' } }))
    state.shops.push(shop('black-sushi-garden', { deletedAt: new Date() }))
    const plan = buildSyncPlan(state)
    expect(plan.shops.remove.map((r) => r.slug)).toEqual(['black-tavuk-garden'])
    expect(plan.shops.archive).toEqual([])
  })

  it('çöpteki eski kayıt geri getirilmez: slug boşaltılır, yerine yeni kayıt açılır', () => {
    const state = inSync()
    state.shops = state.shops.filter((s) => s.slug !== 'black-tost-iyas')
    state.shops.push(shop('black-tost-iyas', { id: 'eski-0123456789', deletedAt: new Date() }))
    state.locations = state.locations.filter((l) => l.slug !== 'iyas')
    state.locations.push(loc('iyas', { id: 'eski-loc-abcdefgh', deletedAt: new Date() }))
    const plan = buildSyncPlan(state)
    expect(plan.shops.archive).toEqual([
      { id: 'eski-0123456789', slug: 'black-tost-iyas', to: 'black-tost-iyas-eski-23456789' },
    ])
    expect(plan.shops.create.map((r) => r.slug)).toEqual(['black-tost-iyas'])
    expect(plan.locations.archive.map((r) => r.to)).toEqual(['iyas-eski-abcdefgh'])
    expect(plan.locations.create.map((r) => r.slug)).toEqual(['iyas'])
  })

  it('eksik dükkan açılır; ad, mekan ve sıra farkı yapı güncellemesi olur', () => {
    const state = inSync()
    state.shops = state.shops.filter((s) => s.slug !== 'lulu-kafe')
    state.shops = state.shops.map((s) =>
      s.slug === 'black-tost-carsi' ? { ...s, name: 'Tost', sortOrder: 9 } : s,
    )
    const plan = buildSyncPlan(state)
    expect(plan.shops.create).toEqual([{ slug: 'lulu-kafe', name: 'Lulu Kafe' }])
    expect(plan.shops.update).toEqual([
      expect.objectContaining({
        slug: 'black-tost-carsi',
        fields: ['ad: Tost → Black Tost Çarşı', 'sıra: 9 → 3'],
      }),
    ])
  })

  it('arşiv slug’ı kimliğin son 8 hanesiyle benzersizleşir', () => {
    expect(archivedSlug('iyas', '01a0-1234-abcd-ef567890')).toBe('iyas-eski-ef567890')
  })
})
