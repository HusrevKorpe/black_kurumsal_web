'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
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

  const filmRef = useRef<HTMLUListElement>(null)
  const [canPrev, setCanPrev] = useState(false)
  const [canNext, setCanNext] = useState(false)

  const updateEdges = useCallback(() => {
    const film = filmRef.current
    if (!film) return
    setCanPrev(film.scrollLeft > 4)
    setCanNext(film.scrollLeft + film.clientWidth < film.scrollWidth - 4)
  }, [])

  useEffect(() => {
    const film = filmRef.current
    if (!film) return
    updateEdges()
    const observer = new ResizeObserver(updateEdges)
    observer.observe(film)
    return () => observer.disconnect()
  }, [updateEdges, count])

  const scrollFilm = (direction: 1 | -1) => {
    const film = filmRef.current
    const frame = film?.querySelector('li')
    if (!film || !frame) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    film.scrollBy({
      left: direction * (frame.offsetWidth + 10),
      behavior: reduce ? 'auto' : 'smooth',
    })
  }

  if (count === 0) return null
  const active = index === null ? null : images[index]

  return (
    <>
      {/*
        Film şeridi: parmakla yana kayar, kareler mıknatısla oturur. gallery-deferred: ekrana
        yaklaşmadan resimler inmesin (telefonda ilk yükün en büyük kalemi).
      */}
      <div className="relative">
        <ul
          ref={filmRef}
          onScroll={updateEdges}
          className="gallery-deferred pafta-film"
          aria-label={`${title} – ${tr.shop.gallery}`}
        >
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
        {/*
          Şerit okları: resim alanının dikey ortasında (alttaki yazı satırı hariç). Uçta olan ok
          gizlenir; her basış bir kare kaydırır, mıknatıs kareyi yerine oturtur.
        */}
        {canPrev ? (
          <button
            type="button"
            onClick={() => scrollFilm(-1)}
            aria-label="Önceki fotoğraflar"
            className="pafta-film-arrow left-1 md:-left-3"
          >
            <ChevronLeftIcon aria-hidden className="size-6" />
          </button>
        ) : null}
        {canNext ? (
          <button
            type="button"
            onClick={() => scrollFilm(1)}
            aria-label="Sonraki fotoğraflar"
            className="pafta-film-arrow right-1 md:-right-3"
          >
            <ChevronRightIcon aria-hidden className="size-6" />
          </button>
        ) : null}
      </div>

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
