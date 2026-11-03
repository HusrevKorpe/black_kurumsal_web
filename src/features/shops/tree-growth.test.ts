import { describe, expect, it } from 'vitest'
import { buildGrowth, cubicLength, type GrowthNode, SEED_AT, taperOutline } from './tree-growth'

// Telefondaki yerleşim: kök üstte, Çarşı ve iki dükkanı, en altta bağsız Lavinya.
const phone: GrowthNode[] = [
  { id: 'root', parent: null, box: { x: 16, y: 0, w: 358, h: 200 } },
  { id: 'carsi', parent: 'root', box: { x: 44, y: 212, w: 80, h: 48 } },
  { id: 'ps', parent: 'carsi', box: { x: 72, y: 268, w: 300, h: 64 } },
  { id: 'tost', parent: 'carsi', box: { x: 72, y: 340, w: 300, h: 64 } },
  { id: 'lavinya', parent: 'root', box: { x: 44, y: 416, w: 330, h: 64 } },
]

describe('buildGrowth', () => {
  it('kök yoksa çizmez', () => {
    expect(buildGrowth([], false)).toBeNull()
  })

  it('her düğüme bir dal varır, dal düğümün solunda biter', () => {
    const growth = buildGrowth(phone, false)!
    const arrivals = growth.pieces.filter((p) => p.arrives).map((p) => p.arrives)
    expect(arrivals.sort()).toEqual(['carsi', 'lavinya', 'ps', 'tost'])
    expect(growth.buds).toHaveLength(4)
    for (const bud of growth.buds) {
      const node = phone.find((n) => Math.abs(n.box.y + n.box.h / 2 - bud.y) < 0.01)!
      expect(bud.x).toBeLessThan(node.box.x)
    }
  })

  it('büyüme kökten uçlara: çocuk ebeveyninden sonra açılır, dal varmadan düğüm açılmaz', () => {
    const { arrivals, total } = buildGrowth(phone, false)!
    expect(arrivals.carsi!).toBeGreaterThan(SEED_AT)
    expect(arrivals.ps!).toBeGreaterThan(arrivals.carsi!)
    expect(arrivals.tost!).toBeGreaterThan(arrivals.ps!)
    expect(total).toBe(Math.max(...Object.values(arrivals)))
  })

  it('alt dallar düğümün vardığı yerden sürer, kopuk başlamaz', () => {
    const growth = buildGrowth(phone, false)!
    const carsiBud = growth.buds[0]!
    const fromCarsi = growth.pieces.find((p) => p.start === growth.arrivals.carsi)!
    expect(fromCarsi.d.startsWith(`M${carsiBud.x} ${carsiBud.y}`)).toBe(true)
  })

  it('soy çizgisi: gövde altındaki herkesi, dal yalnız kendi alt ağacını besler', () => {
    const growth = buildGrowth(phone, false)!
    const toPs = growth.pieces.find((p) => p.arrives === 'ps')!
    expect(toPs.feeds).toEqual(['ps'])
    const toCarsi = growth.pieces.find((p) => p.arrives === 'carsi')!
    expect(toCarsi.feeds).toEqual(['carsi', 'ps', 'tost'])
  })

  it('geniş ekranda dallar kökün ortasından yelpaze gibi aynı anda çıkar', () => {
    const wide: GrowthNode[] = [
      { id: 'root', parent: null, box: { x: 0, y: 0, w: 1100, h: 180 } },
      { id: 'carsi', parent: 'root', box: { x: 40, y: 260, w: 80, h: 48 } },
      { id: 'lavinya', parent: 'root', box: { x: 600, y: 260, w: 500, h: 64 } },
    ]
    const growth = buildGrowth(wide, true)!
    expect(growth.seed).toEqual({ x: 550, y: 180 })
    const fan = growth.pieces.filter((p) => p.start === SEED_AT)
    expect(fan.map((p) => p.arrives).sort()).toEqual(['carsi', 'lavinya'])
    expect(growth.arrivals.carsi!).toBeGreaterThan(growth.arrivals.lavinya!)
  })
})

describe('taperOutline', () => {
  it('kapalı bir şekil verir ve uzunluk düz çizgide doğru çıkar', () => {
    const line = [
      { x: 0, y: 0 },
      { x: 0, y: 10 },
      { x: 0, y: 20 },
      { x: 0, y: 30 },
    ] as const
    expect(cubicLength(line)).toBeCloseTo(30, 5)
    const d = taperOutline(line, 4, 1)
    // Başta 4 px genişlik: iki yana 2'şer; uçta 1 px.
    expect(d.startsWith('M-2 0')).toBe(true)
    expect(d).toContain('L-0.5 30L0.5 30')
    expect(d.endsWith('L2 0Z')).toBe(true)
  })
})
