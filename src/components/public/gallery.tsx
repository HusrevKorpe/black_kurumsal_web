'use client'

import dynamic from 'next/dynamic'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { tr } from '@/lib/i18n/tr'

export interface GalleryImageItem {
  id: string
  url: string
  alt: string
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
      {/* gallery-deferred: ekrana yaklaşmadan küçük resimler inmesin (telefonda ilk yükün en büyük kalemi). */}
      <ul className="gallery-deferred grid grid-cols-2 gap-2 sm:grid-cols-3">
        {images.map((image, i) => (
          <li key={image.id} className={i === 0 ? 'col-span-2 row-span-2 sm:col-span-2' : ''}>
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
              className="relative block aspect-[4/3] w-full overflow-hidden rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
              aria-label={`${title} – ${tr.shop.gallery} ${i + 1}`}
            >
              <Image
                src={image.url}
                alt={image.alt}
                fill
                sizes={
                  i === 0 ? '(min-width: 1024px) 50vw, 100vw' : '(min-width: 1024px) 25vw, 50vw'
                }
                className="object-cover transition-transform duration-300 hover:scale-[1.03] motion-reduce:hover:scale-100"
              />
            </button>
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
