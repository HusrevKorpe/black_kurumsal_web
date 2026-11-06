import type { CSSProperties } from 'react'
import { ArrowLeftIcon, MessageCircleIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { InstagramIcon } from '@/components/icons'
import type { ShopType } from '@/generated/prisma/enums'
import type { ResolvedContact } from '@/features/shops/contact'
import { ROUTES } from '@/lib/constants/routes'
import { tr } from '@/lib/i18n/tr'
import { mediaPublicUrl, type MediaRef } from '@/lib/media/url'
import { whatsappHref } from '@/lib/utils/format'
import { coverFocusStyle } from '../cover-image'
import { ShopCoverMorph, ShopNameMorph } from '../shop-morph'
import { ShopTypeIcon } from '../shop-type-icon'
import { RenovationPointer } from './renovation-pointer'

interface RenovationStageProps {
  name: string
  slug: string
  type: ShopType
  cover: (MediaRef & { focusY?: number | null }) | null
  contact: ResolvedContact
}

/** Kaynak kıvılcımları: sabit dizi, sunucu ve tarayıcı aynı çizer (rastgele sayı hidrasyonu bozar). */
const SPARKS = [
  [6, 7.2, 0.0, 3],
  [13, 9.1, 2.4, 2],
  [21, 6.4, 4.1, 4],
  [28, 8.3, 1.2, 2],
  [35, 10.2, 3.3, 3],
  [42, 7.7, 5.6, 2],
  [49, 6.9, 0.8, 4],
  [56, 9.6, 2.9, 2],
  [63, 8.0, 4.7, 3],
  [70, 7.1, 1.7, 2],
  [77, 10.6, 3.8, 4],
  [84, 6.6, 0.4, 2],
  [91, 8.8, 2.2, 3],
  [97, 9.3, 5.1, 2],
] as const

function Tape({ className }: { className: string }) {
  const words = tr.renovation.tape.map((w) => w.toLocaleUpperCase('tr'))
  // İçerik iki kez: yarısı kayınca başa sarar, şerit hiç kopmaz.
  const run = [...words, ...words, ...words]
  return (
    <div className={`reno-tape ${className}`} aria-hidden>
      <div className="reno-tape-track">
        {[0, 1].map((copy) => (
          <span key={copy} className="reno-tape-run">
            {run.map((word, i) => (
              <span key={i} className="reno-tape-word">
                {word}
                <span className="reno-tape-dot">◆</span>
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  )
}

/**
 * Tadilattaki dükkanın sayfası: fiyat listesi yerine tek ekranlık sahne. Kendi siyah sahnesi var
 * (açık temada da), çünkü ışık ancak karanlıkta yanar. Sıra: şeritler kayarak girer, mühür büyür,
 * harfler aşağıdan çıkar, neon tabela titreyerek yanar, sonra metin ve düğmeler. Sürekli dönenler
 * yalnız transform/opacity; azaltılmış harekette her şey son hâlinde durur (renovation.css).
 */
export function RenovationStage({ name, slug, type, cover, contact }: RenovationStageProps) {
  const title = tr.renovation.title.toLocaleUpperCase('tr')
  const letters = Array.from(title)
  const seal = tr.renovation.seal(name).toLocaleUpperCase('tr')
  const wa = contact.whatsapp ? whatsappHref(contact.whatsapp, tr.shop.whatsappMessage(name)) : null

  return (
    <section className="reno-stage" aria-labelledby="reno-title">
      <RenovationPointer />
      <div className="reno-grid" aria-hidden />
      <div className="reno-glow reno-glow-a" aria-hidden />
      <div className="reno-glow reno-glow-b" aria-hidden />
      <div className="reno-beam" aria-hidden />
      <div className="reno-cursor" aria-hidden />
      <div className="reno-sparks" aria-hidden>
        {SPARKS.map(([x, d, delay, s], i) => (
          <span
            key={i}
            style={
              {
                '--x': `${x}%`,
                '--d': `${d}s`,
                '--delay': `${delay}s`,
                '--s': `${s}px`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <Tape className="reno-tape-top" />
      <Tape className="reno-tape-bottom" />

      <div className="reno-content">
        <div className="reno-seal">
          <svg className="reno-seal-ring" viewBox="0 0 200 200" aria-hidden>
            <defs>
              <path id="reno-ring" d="M100,100 m-86,0 a86,86 0 1,1 172,0 a86,86 0 1,1 -172,0" />
            </defs>
            <text>
              <textPath href="#reno-ring" textLength="540" lengthAdjust="spacing">
                {seal}
                {seal}
              </textPath>
            </text>
          </svg>
          <svg className="reno-seal-gear" viewBox="0 0 100 100" aria-hidden>
            <circle cx="50" cy="50" r="47" strokeDasharray="2 4.15" />
          </svg>
          <ShopCoverMorph slug={slug}>
            <span className="reno-seal-core">
              {cover ? (
                <Image
                  src={mediaPublicUrl(cover)}
                  alt=""
                  fill
                  priority
                  sizes="(min-width: 768px) 180px, 136px"
                  className="object-cover"
                  style={coverFocusStyle(cover)}
                />
              ) : (
                <ShopTypeIcon type={type} className="size-14 text-[#f2b544]" />
              )}
            </span>
          </ShopCoverMorph>
        </div>

        <ShopNameMorph slug={slug}>
          <p className="reno-shop">{name}</p>
        </ShopNameMorph>

        <h1 id="reno-title" className="reno-title">
          <span className="sr-only">
            {name}: {tr.renovation.title}. {tr.renovation.soon}.
          </span>
          <span className="reno-title-letters" aria-hidden>
            {letters.map((ch, i) => (
              <span key={i} className="reno-letter" style={{ '--i': i } as CSSProperties}>
                {ch}
              </span>
            ))}
          </span>
        </h1>

        <p className="reno-neon" aria-hidden>
          {tr.renovation.soon.toLocaleUpperCase('tr')}
        </p>

        <p className="reno-body">{tr.renovation.body(name)}</p>

        <div className="reno-progress" role="img" aria-label={tr.renovation.progress}>
          <div className="reno-progress-bar">
            <span className="reno-progress-fill" />
          </div>
          <span className="reno-progress-label">
            <span className="reno-progress-dot" />
            {tr.renovation.progress}
          </span>
        </div>

        <div className="reno-actions">
          {contact.instagramUrl ? (
            <a
              href={contact.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              data-track="instagram"
              className="reno-btn reno-btn-primary"
            >
              <InstagramIcon className="size-5" aria-hidden />
              {tr.renovation.follow}
            </a>
          ) : null}
          {wa ? (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              data-track="whatsapp"
              className={contact.instagramUrl ? 'reno-btn' : 'reno-btn reno-btn-primary'}
            >
              <MessageCircleIcon className="size-5" aria-hidden />
              {tr.renovation.ask}
            </a>
          ) : null}
          <Link href={ROUTES.home} className="reno-btn reno-btn-ghost">
            <ArrowLeftIcon className="size-5" aria-hidden />
            {tr.renovation.others}
          </Link>
        </div>
      </div>
    </section>
  )
}
