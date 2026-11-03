/**
 * Açılış ağacının büyüme hesabı: ekrandaki düğüm kutularından (marka, mekan başlığı, dükkan kutusu)
 * organik dallar, yapraklar ve zamanlama çıkarır. Saf fonksiyon; DOM'a dokunmaz, test edilir.
 *
 * Büyüme bir bitki gibi işler: kökten gövde iner, uç bir çatala geldiğinde oradan dal filizlenir,
 * dal düğüme varınca düğüm açılır ve kendi dallarını salar. Derinleştikçe büyüme yavaşlar, dal
 * incelir. Her parça kendi uzunluğu kadar sürer; kısa dal çabuk, uzun dal geç varır.
 */

export interface Box {
  x: number
  y: number
  w: number
  h: number
}

export interface GrowthNode {
  id: string
  parent: string | null
  box: Box
}

interface Point {
  x: number
  y: number
}

type Cubic = readonly [Point, Point, Point, Point]

export interface GrowthPiece {
  /** Orta çizgi: maske ve uçtaki ışık bunun üzerinden yürür. */
  d: string
  /** Sivrilen dalın dolgu şekli. */
  outline: string
  /** Çizgi kalınlığının en büyüğü; maske bu kadar geniş çizilir. */
  width: number
  length: number
  /** Büyümenin başladığı an ve süresi (sn). */
  start: number
  duration: number
  easing: string
  /** Kökten bu parçanın başına kadar dallar boyunca uzaklık (px); öz ışığı buna göre akar. */
  distance: number
  /** Bu parçanın beslediği düğümler; dükkan üstüne gelince soy çizgisi yanar. */
  feeds: string[]
  /** Parça bir düğüme varıyorsa o düğüm. */
  arrives: string | null
}

export interface GrowthLeaf {
  x: number
  y: number
  angle: number
  size: number
  at: number
}

export interface GrowthBud {
  x: number
  y: number
  at: number
}

export interface Growth {
  seed: Point
  pieces: GrowthPiece[]
  leaves: GrowthLeaf[]
  buds: GrowthBud[]
  /** Düğümün açılacağı an (sn). */
  arrivals: Record<string, number>
  /** Son düğümün açıldığı an. */
  total: number
}

/** Tohum belirir, sonra gövde iner. */
export const SEED_AT = 0.2
/** Kökten uzaklaştıkça büyüme yavaşlar (px/sn). */
const SPEED = [620, 460, 360] as const
const MIN_DURATION = 0.14
/** Gövde aralarda durmadan akar; dal ucu düğüme yaklaşırken yavaşlar. */
const EASE_FLOW = 'linear'
const EASE_ARRIVE = 'cubic-bezier(0.23, 1, 0.32, 1)'
/** Dirsekten düğüme kadar yatay boşluk: dal kutuya değmeden durur. */
const GAP = 3
/** Gövdenin düğümün solundan içeride durduğu yer (CSS'teki `--tree-x`). */
const SPINE_X = 12

const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))
const r1 = (v: number) => Math.round(v * 10) / 10

function at(c: Cubic, t: number): Point {
  const u = 1 - t
  const a = u * u * u
  const b = 3 * u * u * t
  const d = 3 * u * t * t
  const e = t * t * t
  return {
    x: a * c[0].x + b * c[1].x + d * c[2].x + e * c[3].x,
    y: a * c[0].y + b * c[1].y + d * c[2].y + e * c[3].y,
  }
}

function tangent(c: Cubic, t: number): Point {
  const u = 1 - t
  const x =
    3 * u * u * (c[1].x - c[0].x) + 6 * u * t * (c[2].x - c[1].x) + 3 * t * t * (c[3].x - c[2].x)
  const y =
    3 * u * u * (c[1].y - c[0].y) + 6 * u * t * (c[2].y - c[1].y) + 3 * t * t * (c[3].y - c[2].y)
  const len = Math.hypot(x, y) || 1
  return { x: x / len, y: y / len }
}

export function cubicLength(c: Cubic): number {
  let len = 0
  let prev = c[0]
  for (let i = 1; i <= 24; i++) {
    const p = at(c, i / 24)
    len += Math.hypot(p.x - prev.x, p.y - prev.y)
    prev = p
  }
  return len
}

/** Sivrilen dal: orta çizgiden iki yana kalınlığın yarısı kadar açılan kapalı şekil. */
export function taperOutline(c: Cubic, w0: number, w1: number): string {
  const n = clamp(Math.round(cubicLength(c) / 5), 6, 40)
  const left: string[] = []
  const right: string[] = []
  for (let i = 0; i <= n; i++) {
    const t = i / n
    const p = at(c, t)
    const g = tangent(c, t)
    const half = lerp(w0, w1, t) / 2
    left.push(`${r1(p.x - g.y * half)} ${r1(p.y + g.x * half)}`)
    right.push(`${r1(p.x + g.y * half)} ${r1(p.y - g.x * half)}`)
  }
  return `M${left.join('L')}L${right.reverse().join('L')}Z`
}

const pathOf = (c: Cubic) =>
  `M${r1(c[0].x)} ${r1(c[0].y)}C${r1(c[1].x)} ${r1(c[1].y)} ${r1(c[2].x)} ${r1(c[2].y)} ${r1(c[3].x)} ${r1(c[3].y)}`

/** Düğümün dalı nereye girer: sol kenarın ortası, biraz boşlukla. */
const anchorOf = (b: Box): Point => ({ x: b.x - GAP, y: b.y + b.h / 2 })

/** Her çatalda dal biraz kıvrılır; sıra numarasından gelir, her açılışta aynı. */
const wobble = (i: number) => (i % 2 === 0 ? 1.4 : -1.1)

/**
 * `wide`: geniş ekranda kökün çocukları yan yana sütunlardır; dallar kökün altından yelpaze gibi
 * açılır. Telefonda ve alt dallarda gövde düğümün solundan aşağı iner, her çocuğa bir dal verir.
 */
export function buildGrowth(nodes: readonly GrowthNode[], wide: boolean): Growth | null {
  const root = nodes.find((n) => n.parent === null)
  if (!root) return null
  const kids = new Map<string, GrowthNode[]>()
  for (const n of nodes) {
    if (n.parent === null) continue
    const list = kids.get(n.parent) ?? []
    list.push(n)
    kids.set(n.parent, list)
  }
  const subtree = (id: string): string[] => [
    id,
    ...(kids.get(id) ?? []).flatMap((k) => subtree(k.id)),
  ]

  const seed: Point = wide
    ? { x: root.box.x + root.box.w / 2, y: root.box.y + root.box.h }
    : { x: root.box.x + SPINE_X, y: root.box.y + root.box.h }

  const growth: Growth = { seed, pieces: [], leaves: [], buds: [], arrivals: {}, total: SEED_AT }

  const add = (
    c: Cubic,
    w0: number,
    w1: number,
    start: number,
    depth: number,
    distance: number,
    feeds: string[],
    arrives: string | null,
  ) => {
    const length = cubicLength(c)
    const duration = Math.max(MIN_DURATION, length / SPEED[Math.min(depth, SPEED.length - 1)]!)
    growth.pieces.push({
      d: pathOf(c),
      outline: taperOutline(c, w0, w1),
      width: Math.max(w0, w1),
      length,
      start,
      duration,
      easing: arrives ? EASE_ARRIVE : EASE_FLOW,
      distance,
      feeds,
      arrives,
    })
    return { end: start + duration, length }
  }

  const arrive = (
    node: GrowthNode,
    time: number,
    point: Point,
    width: number,
    distance: number,
  ) => {
    growth.arrivals[node.id] = time
    growth.total = Math.max(growth.total, time)
    growth.buds.push({ x: point.x, y: point.y, at: time })
    grow(node, time, width, distance, point)
  }

  /** Gövdeden dala uzanan yaprak: sola, yukarı ya da aşağı dönük, sırayla. */
  const leafOn = (c: Cubic, t: number, side: 1 | -1, time: number, i: number) => {
    const p = at(c, t)
    const g = tangent(c, t)
    const base = Math.atan2(g.y, g.x) * (180 / Math.PI)
    growth.leaves.push({
      x: r1(p.x),
      y: r1(p.y),
      angle: r1(base + side * (i % 2 === 0 ? 58 : 118)),
      size: i % 3 === 0 ? 13 : 10,
      at: time,
    })
  }

  /** `from`: dalın düğüme vardığı yer; alt dallar oradan filizlenir, kopuk durmaz. */
  const grow = (
    node: GrowthNode,
    start: number,
    width: number,
    distance: number,
    from: Point,
  ): void => {
    const children = kids.get(node.id) ?? []
    if (children.length === 0) return
    const depth = node === root ? 0 : 1

    if (node === root && wide) {
      children.forEach((child, i) => {
        // Sütunun soluna yukarıdan iner: dal yazının üstünden geçmez, alt dallar buradan sürer.
        const a = { x: child.box.x - SPINE_X, y: child.box.y + child.box.h / 2 }
        const dy = a.y - seed.y
        const c: Cubic = [
          seed,
          { x: seed.x, y: seed.y + dy * 0.7 },
          { x: a.x, y: a.y - dy * 0.75 },
          a,
        ]
        const piece = add(c, 4.6, 1.8, start, 0, distance, subtree(child.id), child.id)
        const side = a.x < seed.x ? 1 : -1
        leafOn(c, 0.3, side, lerp(start, piece.end, 0.35), i)
        leafOn(c, 0.62, -side as 1 | -1, lerp(start, piece.end, 0.65), i + 1)
        arrive(child, piece.end, a, 2.6, distance + piece.length)
      })
      return
    }

    const sx = node === root ? seed.x : node.box.x + SPINE_X
    const sy = from.y
    const w0 = node === root ? 5 : Math.min(width, 2.6)
    const w1 = node === root ? 2.4 : 1.4
    const forks = children.map((child) => {
      const a = anchorOf(child.box)
      return { child, a }
    })
    const lastY = forks[forks.length - 1]!.a.y
    const span = Math.max(1, lastY - sy)

    let y = sy
    let x = from.x
    let time = start
    let dist = distance
    forks.forEach(({ child, a }, i) => {
      const r = clamp((a.y - y) * 0.5, 6, 20)
      const forkY = Math.max(y, a.y - r)
      const wa = lerp(w0, w1, (y - sy) / span)
      const wb = lerp(w0, w1, (forkY - sy) / span)
      const feeds = forks.slice(i).flatMap((f) => subtree(f.child.id))
      if (forkY - y > 1) {
        const k = wobble(i)
        const third = (forkY - y) / 3
        const c: Cubic = [
          { x, y },
          { x: x + k, y: y + third },
          { x: sx - k, y: forkY - third },
          { x: sx, y: forkY },
        ]
        const seg = add(c, wa, wb, time, depth, dist, feeds, null)
        if (seg.length > 36) leafOn(c, 0.55, 1, lerp(time, seg.end, 0.6), i)
        time = seg.end
        dist += seg.length
        x = sx
      }
      const twig: Cubic = [
        { x, y: forkY },
        { x, y: forkY + r * 0.8 },
        { x: x + (a.x - x) * 0.35, y: a.y },
        a,
      ]
      const last = i === forks.length - 1
      const feedsTwig = subtree(child.id)
      const piece = add(twig, last ? wb : wb * 0.8, 1.1, time, depth + 1, dist, feedsTwig, child.id)
      arrive(child, piece.end, a, wb * 0.9, dist + piece.length)
      y = forkY
    })
  }

  grow(root, SEED_AT, 5, 0, seed)
  return growth
}
