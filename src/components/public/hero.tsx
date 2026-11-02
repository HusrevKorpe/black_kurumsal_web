import { ChevronDownIcon } from 'lucide-react'
import Image from 'next/image'
import { tr } from '@/lib/i18n/tr'
import { HeroMotion } from './hero-motion'
import { HeroWordmark } from './hero-wordmark'
import { HeroWordmarkGhost } from './hero-wordmark-ghost'

interface HeroProps {
  brandName: string
  title: string
  subtitle: string | null
}

/**
 * Tek siyah cephe: ilk ekranın tamamını video ve dev marka yazısı kaplar, dükkan listesi kaydırınca
 * gelir. Listenin aşağıda olduğunu alttaki işaret söyler.
 */
const HERO_IMAGE_SIZES = '100vw'
/** Videonun ilk karesi: video başlayınca sıçrama olmasın. */
const HERO_POSTER = '/media/hero-poster.jpg'

export function Hero({ brandName, title, subtitle }: HeroProps) {
  return (
    <section className="hero relative isolate flex flex-col justify-end overflow-hidden">
      <HeroMotion
        poster={
          <Image
            src={HERO_POSTER}
            alt=""
            fill
            sizes={HERO_IMAGE_SIZES}
            loading="eager"
            fetchPriority="high"
            className="object-cover"
          />
        }
      />
      {/* Video oynarken harfler pencere olur: katman `multiply` ile karartır, beyaz harfler videoyu olduğu gibi geçirir. */}
      <div className="hero-mask" aria-hidden>
        <HeroCopy brandName={brandName} title={title} subtitle={subtitle} ghost />
      </div>
      {/* Karanlık sahnede de yazı seçilsin: ince kontur ve hafif beyaz dolgu. */}
      <div className="hero-outline" aria-hidden>
        <HeroCopy brandName={brandName} title={title} subtitle={subtitle} ghost />
      </div>
      <HeroCopy brandName={brandName} title={title} subtitle={subtitle} />
      <a href="#dukkanlar" className="hero-scroll-cue">
        {tr.nav.shops}
        <ChevronDownIcon className="size-5" aria-hidden />
      </a>
    </section>
  )
}

/** Yerleşim katmanlarda birebir aynı kalsın diye tek yerde; `ghost` kopyada yalnız harfler görünür. */
function HeroCopy({
  brandName,
  title,
  subtitle,
  ghost = false,
}: Pick<HeroProps, 'brandName' | 'title' | 'subtitle'> & { ghost?: boolean }) {
  const Title = ghost ? 'p' : 'h1'
  return (
    <div className="hero-copy relative z-10 mx-auto w-full max-w-6xl px-4 pt-2 pb-2 sm:px-6 sm:pb-8">
      {ghost ? <HeroWordmarkGhost text={brandName} /> : <HeroWordmark text={brandName} />}
      <Title
        className={`mt-2 pr-10 text-base font-medium text-balance sm:mt-3 sm:text-2xl ${ghost ? 'invisible' : ''}`}
      >
        {title}
      </Title>
      {subtitle ? (
        <p
          className={`mt-2 hidden max-w-2xl text-lg text-muted-foreground sm:block ${ghost ? 'invisible' : ''}`}
        >
          {subtitle}
        </p>
      ) : null}
    </div>
  )
}
