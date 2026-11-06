'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { tr } from '@/lib/i18n/tr'

export interface GalleryImageItem {
  id: string
  url: string
  alt: string
  /** Panelde yazılmış açıklama; yoksa karenin altında yalnız numara durur (uydurma yazı yok). */
  caption?: string | null
}

interface GalleryProps {
  images: GalleryImageItem[]
  title: string
}

// Büyük görünüm (base-ui Dialog) yalnızca ilk dokunuşta iner; sayfanın ilk yüküne girmez.
const loadLightbox = () => import('./gallery-lightbox')
const GalleryLightbox = dynamic(() => loadLightbox().then((m) => m.GalleryLightbox), { ssr: false })

export function Gallery({ images, title }: GalleryProps) {
  const [index, setIndex] = useState<number | null>(null)
  // İlk açılıştan sonra takılı kalır ki kapanış animasyonu oynasın.
  const [lightboxMounted, setLightboxMounted] = useState(false)
  const count = images.length

  const step = useCallback(
    (delta: number) =>
      setIndex((current) => (current === null ? null : (current + delta + count) % count)),
    [count],
  )

  useEffect(() => {
    if (index === null) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') step(1)
      if (event.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, step])

  if (count === 0) return null
  const active = index === null ? null : images[index]

  return (
    <>
      {/*
        Film şeridi: parmakla yana kayar, kareler mıknatısla oturur. gallery-deferred: ekrana
        yaklaşmadan resimler inmesin (telefonda ilk yükün en büyük kalemi).
      */}
      <ul className="gallery-deferred pafta-film" aria-label={`${title} – ${tr.shop.gallery}`}>
        {images.map((image, i) => (
          <li key={image.id}>
            <figure className="pafta-frame m-0">
              <button
                type="button"
                data-track="gallery"
                onPointerDown={() => {
                  loadLightbox().catch(() => undefined)
                }}
                onClick={() => {
                  setLightboxMounted(true)
                  setIndex(i)
                }}
                className="relative block aspect-[3/4] w-full overflow-hidden focus-visible:ring-[3px] focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
                aria-label={`${image.caption ?? title} – ${tr.shop.gallery} ${i + 1} / ${count}`}
              >
                <Image
                  src={image.url}
                  alt={image.alt}
                  fill
                  sizes="(min-width: 768px) 300px, 72vw"
                  className="object-cover transition-transform duration-300 hover:scale-[1.03] motion-reduce:hover:scale-100"
                />
              </button>
              <figcaption className="line-clamp-2 pt-1.5 text-[12.5px] text-[var(--pafta-soft)]">
                <span className="tabular-nums">{String(i + 1).padStart(2, '0')}</span>
                {image.caption ? ` · ${image.caption}` : null}
              </figcaption>
            </figure>
          </li>
        ))}
      </ul>

      {lightboxMounted ? (
        <GalleryLightbox
          active={active ?? null}
          position={index}
          count={count}
          title={title}
          onClose={() => setIndex(null)}
          onStep={step}
        />
      ) : null}
    </>
  )
}
