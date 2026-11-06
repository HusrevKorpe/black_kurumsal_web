'use client'

import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import type { GalleryImageItem } from './gallery'

interface GalleryLightboxProps {
  active: GalleryImageItem | null
  /** Açık görselin sırası; kapalıyken null. */
  position: number | null
  count: number
  title: string
  onClose: () => void
  onStep: (delta: number) => void
}

/** Galerinin tam ekran görünümü; `gallery.tsx` bunu yalnızca ilk açılışta yükler. */
export function GalleryLightbox({
  active,
  position,
  count,
  title,
  onClose,
  onStep,
}: GalleryLightboxProps) {
  const label = position !== null ? `${position + 1} / ${count}` : ''

  return (
    <Dialog open={active !== null} onOpenChange={(open) => !open && onClose()}>
      {/* Kapatma düğmesi siyah görsel alanının üstünde durur: iki temada da açık simge, koyu zemin; 48 px. */}
      <DialogContent className="max-w-4xl border-none bg-transparent p-0 shadow-none sm:max-w-4xl [&_[data-slot=dialog-close]]:size-12 [&_[data-slot=dialog-close]]:bg-black/60 [&_[data-slot=dialog-close]]:text-white [&_[data-slot=dialog-close]]:hover:bg-black/80 [&_[data-slot=dialog-close]]:hover:text-white">
        <DialogTitle className="sr-only">{title}</DialogTitle>
        <DialogDescription className="sr-only">{label}</DialogDescription>
        {active ? (
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-black">
            <Image
              src={active.url}
              alt={active.alt}
              fill
              sizes="100vw"
              className="object-contain"
              loading="eager"
            />
          </div>
        ) : null}
        {count > 1 ? (
          <div className="mt-2 flex items-center justify-center gap-3">
            <Button
              variant="secondary"
              size="icon"
              className="size-12"
              onClick={() => onStep(-1)}
              aria-label="Önceki"
            >
              <ChevronLeftIcon />
            </Button>
            <span className="text-sm tabular-nums">{label}</span>
            <Button
              variant="secondary"
              size="icon"
              className="size-12"
              onClick={() => onStep(1)}
              aria-label="Sonraki"
            >
              <ChevronRightIcon />
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
