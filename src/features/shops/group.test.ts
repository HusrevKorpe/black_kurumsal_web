import { describe, expect, it } from 'vitest'
import { groupShopsByCategory } from './group'

describe('groupShopsByCategory', () => {
  it('kategori sırasını korur ve boş kategorileri atar', () => {
    const groups = groupShopsByCategory([
      { type: 'APART' as const, name: 'Apart' },
      { type: 'FOOD' as const, name: 'Tost' },
      { type: 'PLAYSTATION' as const, name: 'PS' },
      { type: 'INTERNET_CAFE' as const, name: 'Net' },
    ])
    expect(groups.map((g) => g.key)).toEqual(['ENTERTAINMENT', 'FOOD', 'ACCOMMODATION'])
    expect(groups[0]?.shops.map((s) => s.name)).toEqual(['PS', 'Net'])
    expect(groups[0]?.anchorId).toBe('kategori-entertainment')
  })

  it('boş listede boş döner', () => {
    expect(groupShopsByCategory([])).toEqual([])
  })
})
