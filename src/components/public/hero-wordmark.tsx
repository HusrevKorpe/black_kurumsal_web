import { Sora } from 'next/font/google'

// Yalnız açılıştaki büyük marka yazısı: tek ağırlık. Üstteki küçük logo Barlow'da kalır.
const sora = Sora({ subsets: ['latin', 'latin-ext'], weight: '800', display: 'swap' })

// Işık çizgisi: soldan alttan girer, harflerin arkasından geçip sağ üstten çıkar.
const LINE = 'M4 80C70 98 140 82 205 56S330 6 436 20'

/**
 * Açılıştaki büyük marka adı. İlk "A" harfi altın sarısı ve hafif ışıltılı; arkasından ince, kıvrımlı
 * bir altın çizgi geçer. Çizgi mutlak konumlu: kök kutusunun ölçüsünü (dallar ona bağlanır) değiştirmez.
 */
export function HeroWordmark({ name }: { name: string }) {
  const at = name.search(/a/i)
  return (
    <p className={`${sora.className} hero-wordmark uppercase`} aria-hidden>
      <svg
        className="hero-wordmark-line"
        viewBox="0 0 440 100"
        preserveAspectRatio="none"
        focusable="false"
      >
        <path d={LINE} pathLength={1} className="hero-wordmark-stroke" />
        <path d={LINE} pathLength={1} className="hero-wordmark-spark" />
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
