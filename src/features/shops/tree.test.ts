import { describe, expect, it } from 'vitest'
import { buildShopTree } from './tree'

const carsi = { id: 'l1', slug: 'carsi', name: 'Çarşı', kind: 'DISTRICT' as const }
const iyas = { id: 'l3', slug: 'iyas', name: 'Iyaş', kind: 'DISTRICT' as const }
const garden = { id: 'l2', slug: 'black-garden', name: 'Black Garden', kind: 'VENUE' as const }

describe('buildShopTree', () => {
  it('dükkanları mekan altında toplar, bağsız dükkan köke bağlanır, sıra korunur', () => {
    const tree = buildShopTree([
      { id: 'ps', location: carsi },
      { id: 'lavinya', location: null },
      { id: 'tost', location: carsi },
    ])
    expect(tree.map((n) => n.key)).toEqual(['l1', 'lavinya'])
    const first = tree[0]
    expect(first?.kind === 'group' && first.shops.map((s) => s.id)).toEqual(['ps', 'tost'])
  })

  it('mekan listesi verilince önce mekan/bölgeler sırayla, sonra bağsız dükkanlar gelir', () => {
    const tree = buildShopTree(
      [
        { id: 'lulu', location: null },
        { id: 'ps-iyas', location: iyas },
        { id: 'ps', location: carsi },
      ],
      [carsi, iyas, garden],
    )
    expect(tree.map((n) => [n.kind, n.key])).toEqual([
      ['group', 'l1'],
      ['group', 'l3'],
      ['venue', 'l2'],
      ['shop', 'lulu'],
    ])
  })

  it('mekan (Black Garden) tek uçtur: dükkanları ağaca girmez, yalnızca sayılır; dükkansız da görünür', () => {
    const empty = buildShopTree([], [garden])
    expect(empty).toEqual([{ kind: 'venue', key: 'l2', location: garden, shopCount: 0 }])
    const full = buildShopTree(
      [
        { id: 'tavuk', location: garden },
        { id: 'makarna', location: garden },
      ],
      [garden],
    )
    expect(full).toEqual([{ kind: 'venue', key: 'l2', location: garden, shopCount: 2 }])
  })

  it('dükkanı olmayan bölge görünmez', () => {
    expect(buildShopTree([{ id: 'ps', location: carsi }], [carsi, iyas]).map((n) => n.key)).toEqual(
      ['l1'],
    )
  })
})
