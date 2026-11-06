import type { Media } from '@/generated/prisma/client'
import { tr } from '@/lib/i18n/tr'
import { CoverImage } from '../cover-image'
import { ShopCoverMorph } from '../shop-morph'

interface PaftaCoverProps {
  media: Pick<Media, 'bucket' | 'path' | 'alt'> & Partial<Pick<Media, 'focusY'>>
  alt: string
  /** Alt yazının sol yanı: "Kapak · {caption}" (gerçek veri: tür, konum). */
  caption: string | null
  galleryCount: number
  /** Dükkan sayfasında karttan geçiş: büyüyen parça yalnız fotoğraf, çerçeve ve gölge taşınmaz. */
  morphSlug?: string
}

/**
 * Çerçeveli kapak: paspartu, 1,5 px çizgi, kaydırılmış sert gölge. Fotoğraf çerçevenin içini
 * kırparak doldurur (bulanık zemin yok, `focusY` görünen dilimi seçer). Telefonda dik 4:5,
 * geniş ekranda 5:4.
 */
export function PaftaCover({ media, alt, caption, galleryCount, morphSlug }: PaftaCoverProps) {
  const photo = (
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
