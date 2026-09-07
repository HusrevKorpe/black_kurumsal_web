import Image from 'next/image'
import type { Media } from '@/generated/prisma/client'
import { mediaPublicUrl } from '@/lib/media/url'
import { cn } from '@/lib/utils'

interface CoverImageProps {
  media: Pick<Media, 'bucket' | 'path' | 'alt'> | null
  alt: string
  sizes: string
  priority?: boolean
  className?: string
}

/** Kapak görseli; görsel yoksa marka renginde zemin. Oran dış kapsayıcıdan gelir. */
export function CoverImage({ media, alt, sizes, priority = false, className }: CoverImageProps) {
  if (!media) {
    return (
      <div
        aria-hidden
        className={cn(
          'absolute inset-0 bg-gradient-to-br from-brand/30 via-transparent to-background',
          className,
        )}
      />
    )
  }
  return (
    <Image
      src={mediaPublicUrl(media)}
      alt={media.alt ?? alt}
      fill
      sizes={sizes}
      priority={priority}
      // priority yalnızca preload ekler; LCP görselinin ağ kuyruğunda öne geçmesi için gerekir.
      fetchPriority={priority ? 'high' : undefined}
      className={cn('object-cover', className)}
    />
  )
}
