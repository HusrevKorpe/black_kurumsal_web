import Image from 'next/image'
import type { Media } from '@/generated/prisma/client'
import { coverObjectPosition } from '@/features/media/cover-focus'
import { mediaPublicUrl } from '@/lib/media/url'
import { cn } from '@/lib/utils'

/** Kırpılan kapağın görünen dilimi; kapak, küçük resmi ve sayfaya akan kopyası aynı noktayı göstermeli. */
export function coverFocusStyle(
  media: Partial<Pick<Media, 'focusY'>>,
): { objectPosition: string } | undefined {
  const objectPosition = coverObjectPosition(media.focusY)
  return objectPosition ? { objectPosition } : undefined
}

interface CoverImageProps {
  media: (Pick<Media, 'bucket' | 'path' | 'alt'> & Partial<Pick<Media, 'focusY'>>) | null
  alt: string
  sizes: string
  priority?: boolean
  className?: string
}

/**
 * Kapak görseli; görsel yoksa düz yüzey (üstündeki yazı alanı tamamlar). Oran dış kapsayıcıdan gelir.
 * Fotoğraf şeridi kırparak doldurur (patron bulanık zemin/letterbox istemedi); dik fotoğrafta görünen
 * dilimi `focusY` seçer, yoksa ortası.
 */
export function CoverImage({ media, alt, sizes, priority = false, className }: CoverImageProps) {
  if (!media) {
    return <div aria-hidden className={cn('absolute inset-0 bg-card', className)} />
  }
  return (
    <Image
      src={mediaPublicUrl(media)}
      alt={media.alt ?? alt}
      fill
      sizes={sizes}
      // Next 16'da `priority` kalktı; ilk ekran görseli için kılavuzun önerisi eager + yüksek öncelik.
      loading={priority ? 'eager' : undefined}
      fetchPriority={priority ? 'high' : undefined}
      className={cn('object-cover', className)}
      style={coverFocusStyle(media)}
    />
  )
}
