import { describe, expect, it } from 'vitest'
import { buildShopTree } from './tree'

const carsi = { id: 'l1', slug: 'carsi', name: 'Çarşı', kind: 'DISTRICT' as const }
const garden = { id: 'l2', slug: 'black-garden', name: 'Black Garden', kind: 'VENUE' as const }

describe('buildShopTree', () => {
  it('dükkanları mekan altında toplar, bağsız dükkan köke bağlanır, sıra korunur', () => {
    const tree = buildShopTree([
      { id: 'ps', location: carsi },
      { id: 'tavuk', location: garden },
      { id: 'tost', location: carsi },
      { id: 'lavinya', location: null },
    ])
    expect(tree.map((n) => n.key)).toEqual(['l1', 'l2', 'lavinya'])
    const first = tree[0]
    expect(first?.kind === 'group' && first.shops.map((s) => s.id)).toEqual(['ps', 'tost'])
  })
})
