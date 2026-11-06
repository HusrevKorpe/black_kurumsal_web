import Image from 'next/image'
import type { Media } from '@/generated/prisma/client'
import { tr } from '@/lib/i18n/tr'
import { mediaPublicUrl } from '@/lib/media/url'
import { CoverImage } from '../cover-image'
import { ShopCoverMorph } from '../shop-morph'

interface PaftaCoverProps {
  media: Pick<Media, 'bucket' | 'path' | 'alt'> & Partial<Pick<Media, 'focusY' | 'width'>>
  alt: string
  /** Alt yazının sol yanı: "Kapak · {caption}" (gerçek veri: tür, konum). */
  caption: string | null
  galleryCount: number
  /** Dükkan sayfasında karttan geçiş: büyüyen parça yalnız fotoğraf, çerçeve ve gölge taşınmaz. */
  morphSlug?: string
}

/**
 * Logo kapağı karttaki rozet gibi yuvarlak ve ortada durur: kutuya kırpılırsa dairesi kesilir.
 * İşaret başlıktır ("Sushi Go – Logo"; panelde başlık, toplu yüklemede dosya adı); kare olmak yetmez,
 * kare çekilmiş oda fotoğrafı da var. Bu genişliğin altındaki görsel de büyütülünce bulanıklaşacağı
 * için aynı biçimde, kendi boyutundan büyümeden durur.
 */
const SMALL_COVER_MAX_WIDTH = 480
const LOGO_ALT = /\blogo$/i

function isLogoCover(media: Partial<Pick<Media, 'width' | 'alt'>>): boolean {
  if (media.alt && LOGO_ALT.test(media.alt.trim())) return true
  return media.width != null && media.width < SMALL_COVER_MAX_WIDTH
}

/**
 * Çerçeveli kapak: paspartu, 1,5 px çizgi, kaydırılmış sert gölge. Fotoğraf çerçevenin içini
 * kırparak doldurur (bulanık zemin yok, `focusY` görünen dilimi seçer). Telefonda dik 4:5,
 * geniş ekranda 5:4.
 */
export function PaftaCover({ media, alt, caption, galleryCount, morphSlug }: PaftaCoverProps) {
  const photo = isLogoCover(media) ? (
    <div className="pafta-photo-frame grid place-items-center bg-[color-mix(in_oklch,var(--brand)_14%,var(--pafta-paper))]">
      <span
        className="relative aspect-square overflow-hidden rounded-full shadow-[0_0_0_1.5px_var(--pafta-rule)]"
        style={{ width: media.width ? `min(${media.width}px, 70%)` : '70%' }}
      >
        <Image
          src={mediaPublicUrl(media)}
          alt={media.alt ?? alt}
          fill
          sizes="(min-width: 1280px) 460px, (min-width: 768px) 37vw, 70vw"
          loading="eager"
          fetchPriority="high"
          className="object-cover"
        />
      </span>
    </div>
  ) : (
    <div className="pafta-photo-frame">
      <CoverImage
        media={media}
        alt={alt}
        sizes="(min-width: 1280px) 660px, (min-width: 768px) 52vw, calc(100vw - 52px)"
        priority
      />
    </div>
  )
  return (
    <figure className="pafta-photo">
      {morphSlug ? <ShopCoverMorph slug={morphSlug}>{photo}</ShopCoverMorph> : photo}
      <figcaption className="flex justify-between gap-3 px-0.5 pt-2 text-[13px] text-[var(--pafta-soft)]">
        <span className="min-w-0 truncate">
          <b className="font-semibold text-foreground">{tr.pafta.cover}</b>
          {caption ? ` · ${caption}` : null}
        </span>
        {galleryCount > 0 ? (
          <span className="shrink-0 tabular-nums">{tr.pafta.photos(galleryCount)}</span>
        ) : null}
      </figcaption>
    </figure>
  )
}
