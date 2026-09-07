'use client'

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
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

export function Gallery({ images, title }: GalleryProps) {
  const [index, setIndex] = useState<number | null>(null)
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
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {images.map((image, i) => (
          <li key={image.id} className={i === 0 ? 'col-span-2 row-span-2 sm:col-span-2' : ''}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              className="relative block aspect-[4/3] w-full overflow-hidden rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              aria-label={`${title} – ${tr.shop.gallery} ${i + 1}`}
            >
              <Image
                src={image.url}
                alt={image.alt}
                fill
                sizes={
                  i === 0 ? '(min-width: 1024px) 50vw, 100vw' : '(min-width: 1024px) 25vw, 50vw'
                }
                className="object-cover transition-transform duration-300 hover:scale-[1.03]"
              />
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={index !== null} onOpenChange={(open) => !open && setIndex(null)}>
        <DialogContent className="max-w-4xl border-none bg-transparent p-0 shadow-none sm:max-w-4xl">
          <DialogTitle className="sr-only">{title}</DialogTitle>
          <DialogDescription className="sr-only">
            {index !== null ? `${index + 1} / ${count}` : ''}
          </DialogDescription>
          {active ? (
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-black">
              <Image
                src={active.url}
                alt={active.alt}
                fill
                sizes="100vw"
                className="object-contain"
                priority
              />
            </div>
          ) : null}
          {count > 1 ? (
            <div className="mt-2 flex items-center justify-center gap-3">
              <Button variant="secondary" size="icon" onClick={() => step(-1)} aria-label="Önceki">
                <ChevronLeftIcon />
              </Button>
              <span className="text-sm tabular-nums">
                {index !== null ? `${index + 1} / ${count}` : ''}
              </span>
              <Button variant="secondary" size="icon" onClick={() => step(1)} aria-label="Sonraki">
                <ChevronRightIcon />
              </Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
