import {
  BedDoubleIcon,
  CoffeeIcon,
  CupSodaIcon,
  DrumstickIcon,
  Gamepad2Icon,
  HeadphonesIcon,
  JoystickIcon,
  KeyRoundIcon,
  type LucideIcon,
  MonitorIcon,
  PizzaIcon,
  SandwichIcon,
  SoupIcon,
} from 'lucide-react'

/**
 * Açılış ağacının zemini: bir harita paftası (tasarim_web, Audi RS6 "tutkun atlası" uyarlaması).
 * Koordinatlı ızgara, yavaşça kayan eş yükselti çizgileri ve ortasından kehribar ışık akan bir yol;
 * ağaç bu paftanın lejantı gibi durur. Tamamen süs: ekran okuyucudan gizli, dokunmayı engellemez.
 * Hareket yalnız `transform` ve `stroke-dashoffset`; azaltılmış harekette durur (globals.css `.atlas`).
 */
const LETTERS = 'ABCDEFGHIJKLMNOP'.split('')
const ROWS = Array.from({ length: 12 }, (_, i) => i + 1)

/**
 * Zeminde yavaşça düşen dükkan eşyaları: oyun, yemek, konaklama. Sıra karışık ki aynı tür yan yana
 * düşmesin. `x` yatay yer (%), `d` süre (sn), `o` başlangıç kayması (sn, eksi: sayfa açıldığında
 * zaten yoldalar), `s` boyut (px), `r` dönüş (derece). `wide` olanlar yalnız geniş ekranda düşer.
 */
const FALLING: {
  Icon: LucideIcon
  x: number
  d: number
  o: number
  s: number
  r: number
  amber?: boolean
  wide?: boolean
}[] = [
  { Icon: Gamepad2Icon, x: 6, d: 19, o: -3, s: 26, r: 40, amber: true },
  { Icon: SandwichIcon, x: 22, d: 23, o: -14, s: 22, r: -30 },
  { Icon: MonitorIcon, x: 38, d: 21, o: -8, s: 24, r: 20 },
  { Icon: DrumstickIcon, x: 54, d: 18, o: -1, s: 22, r: -50, amber: true },
  { Icon: KeyRoundIcon, x: 70, d: 24, o: -17, s: 20, r: 60 },
  { Icon: CupSodaIcon, x: 86, d: 20, o: -10, s: 22, r: -25 },
  { Icon: JoystickIcon, x: 94, d: 22, o: -5, s: 22, r: 35 },
  { Icon: SoupIcon, x: 14, d: 25, o: -20, s: 22, r: 25, wide: true },
  { Icon: HeadphonesIcon, x: 30, d: 20, o: -12, s: 24, r: -40, wide: true },
  { Icon: PizzaIcon, x: 46, d: 22, o: -6, s: 24, r: 45, amber: true, wide: true },
  { Icon: BedDoubleIcon, x: 62, d: 26, o: -22, s: 26, r: -20, wide: true },
  { Icon: CoffeeIcon, x: 78, d: 19, o: -15, s: 22, r: 30, wide: true },
]

export function ShopTreeAtlas() {
  return (
    <div className="atlas" aria-hidden>
      <div className="atlas-fall">
        {FALLING.map(({ Icon, x, d, o, s, r, amber, wide }, i) => (
          <span
            key={i}
            className="atlas-drop"
            data-wide={wide ? '' : undefined}
            style={
              {
                left: `${x}%`,
                '--drop-d': `${d}s`,
                '--drop-o': `${o}s`,
                '--drop-turn': `${r}deg`,
              } as React.CSSProperties
            }
          >
            <Icon
              className={amber ? 'text-brand' : undefined}
              style={{ width: s, height: s }}
              strokeWidth={1.5}
            />
          </span>
        ))}
      </div>
      <svg
        className="atlas-map atlas-map--narrow"
        viewBox="0 0 400 900"
        preserveAspectRatio="none"
        focusable="false"
      >
        <g className="atlas-contours">
          <path d="M-40 180c60-30 120 10 180-6s110-60 300-30" />
          <path d="M-40 210c70-24 130 20 190 2s120-56 290-22" />
          <path d="M-40 244c80-18 140 26 200 8s110-48 280-14" />
          <path d="M-40 560c60 20 110-30 170-12s90 60 310 20" />
          <path d="M-40 590c70 22 120-24 180-6s90 54 300 18" />
          <path d="M-40 800c90-20 150 30 230 10s110-40 250-20" />
        </g>
        <path className="atlas-road" d="M460 40C380 160 330 300 350 440S300 760 180 940" />
        <path className="atlas-road-lane" d="M460 40C380 160 330 300 350 440S300 760 180 940" />
      </svg>
      <svg
        className="atlas-map atlas-map--wide"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        <g className="atlas-contours">
          <path d="M-60 120c200-40 380 30 560 0s300-70 520-40 260 30 440 10" />
          <path d="M-60 150c210-36 390 34 570 4s300-66 520-36 260 30 430 12" />
          <path d="M-60 182c220-30 400 38 580 8s300-60 520-30 260 30 420 14" />
          <path d="M-60 760c240 30 420-40 640-20s380 60 880 10" />
          <path d="M-60 790c250 34 430-36 650-16s370 56 870 12" />
          <path d="M-60 822c260 38 440-32 660-12s360 52 860 14" />
        </g>
        <path className="atlas-road" d="M1500 300C1300 360 1240 520 1060 600S700 760 520 960" />
        <path
          className="atlas-road-lane"
          d="M1500 300C1300 360 1240 520 1060 600S700 760 520 960"
        />
      </svg>
      <ol className="atlas-letters">
        {LETTERS.map((letter) => (
          <li key={letter}>{letter}</li>
        ))}
      </ol>
      <ol className="atlas-numbers">
        {ROWS.map((row) => (
          <li key={row}>{row}</li>
        ))}
      </ol>
    </div>
  )
}
