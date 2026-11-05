import { Sora } from 'next/font/google'

// Yalnız açılıştaki büyük marka yazısı: tek ağırlık. Üstteki küçük logo Barlow'da kalır.
const sora = Sora({ subsets: ['latin', 'latin-ext'], weight: '800', display: 'swap' })

type Pt = readonly [number, number]

/**
 * Işık çizgisinin orta hattı (viewBox 440×100): soldan alttan girer, harflerin arkasından yükselip sağ
 * üstten çıkar. İki kübik parça, birleşimde teğetleri aynı (akıcı, kırıksız).
 */
const CURVE: readonly (readonly [Pt, Pt, Pt, Pt])[] = [
  [
    [8, 76],
    [84, 98],
    [152, 90],
    [218, 62],
  ],
  [
    [218, 62],
    [284, 34],
    [344, 6],
    [432, 22],
  ],
]

const CENTER = `M${CURVE[0]?.[0].join(' ')}${CURVE.map(([, a, b, c]) => `C${a.join(' ')} ${b.join(' ')} ${c.join(' ')}`).join('')}`

function point([p0, p1, p2, p3]: (typeof CURVE)[number], t: number): Pt {
  const u = 1 - t
  const f = (i: 0 | 1) =>
    u * u * u * p0[i] + 3 * u * u * t * p1[i] + 3 * u * t * t * p2[i] + t * t * t * p3[i]
  return [f(0), f(1)]
}

/** Orta hattın çevresinde, ortada `max` kalınlığında, iki ucu sıfıra incelen dolu şerit. */
function ribbon(max: number): string {
  const steps = 48
  const pts: Pt[] = []
  CURVE.forEach((seg, s) => {
    for (let i = s === 0 ? 0 : 1; i <= steps; i++) pts.push(point(seg, i / steps))
  })
  const left: string[] = []
  const right: string[] = []
  pts.forEach(([x, y], i) => {
    const [ax, ay] = pts[i - 1] ?? [x, y]
    const [bx, by] = pts[i + 1] ?? [x, y]
    const len = Math.hypot(bx - ax, by - ay) || 1
    const s = i / (pts.length - 1)
    const half = (max / 2) * Math.pow(Math.sin(Math.PI * s), 0.7)
    const nx = (-(by - ay) / len) * half
    const ny = ((bx - ax) / len) * half
    left.push(`${(x + nx).toFixed(2)} ${(y + ny).toFixed(2)}`)
    right.push(`${(x - nx).toFixed(2)} ${(y - ny).toFixed(2)}`)
  })
  return `M${left.join('L')}L${right.reverse().join('L')}Z`
}

// Telefonda yazı küçük; aynı ekran kalınlığı için şerit viewBox'ta daha kalın.
const RIBBON_NARROW = ribbon(4.2)
const RIBBON_WIDE = ribbon(2.6)

/**
 * Açılıştaki büyük marka adı. İlk "A" harfi altın ve hafif ışıltılı; arkasından iki ucu incelerek
 * kaybolan ince bir altın çizgi geçer. Çizgi mutlak konumlu: kök kutusunun ölçüsünü (dallar ona
 * bağlanır) değiştirmez. Tek sayfada tek kopya olduğu için maske kimliği sabit.
 */
export function HeroWordmark({ name }: { name: string }) {
  const at = name.search(/a/i)
  return (
    <p className={`${sora.className} hero-wordmark uppercase`} aria-hidden>
      <svg className="hero-wordmark-line" viewBox="0 0 440 100" focusable="false">
        <defs>
          <linearGradient
            id="hero-wordmark-gold"
            x1="0"
            x2="440"
            y1="0"
            y2="0"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0" className="hero-wordmark-stop" stopOpacity="0" />
            <stop offset="0.22" className="hero-wordmark-stop" stopOpacity="0.85" />
            <stop offset="0.6" className="hero-wordmark-stop" />
            <stop offset="1" className="hero-wordmark-stop" stopOpacity="0" />
          </linearGradient>
          <mask
            id="hero-wordmark-draw"
            maskUnits="userSpaceOnUse"
            x="-10"
            y="-10"
            width="460"
            height="120"
          >
            <path d={CENTER} pathLength={1} className="hero-wordmark-draw" />
          </mask>
        </defs>
        <g mask="url(#hero-wordmark-draw)" fill="url(#hero-wordmark-gold)">
          <path d={RIBBON_NARROW} className="hero-wordmark-ribbon hero-wordmark-ribbon--narrow" />
          <path d={RIBBON_WIDE} className="hero-wordmark-ribbon hero-wordmark-ribbon--wide" />
        </g>
      </svg>
      <span className="hero-wordmark-text">
        {at < 0 ? (
          name
        ) : (
          <>
            {name.slice(0, at)}
            <span className="hero-wordmark-accent">{name[at]}</span>
            {name.slice(at + 1)}
          </>
        )}
      </span>
    </p>
  )
}
