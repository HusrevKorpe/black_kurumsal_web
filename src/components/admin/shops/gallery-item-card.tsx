'use client'

import { ArrowDownIcon, ArrowUpIcon, StarIcon, Trash2Icon } from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { tr } from '@/lib/i18n/tr'
import { cn } from '@/lib/utils'

export interface GalleryItemView {
  id: string
  mediaId: string
  url: string
  caption: string | null
}

interface GalleryItemCardProps {
  item: GalleryItemView
  index: number
  total: number
  isCover: boolean
  canSetCover: boolean
  disabled: boolean
  onMove: (direction: -1 | 1) => void
  onDelete: () => void
  onSetCover: (mediaId: string | null) => void
  onCaption: (caption: string) => void
}

export function GalleryItemCard({
  item,
  index,
  total,
  isCover,
  canSetCover,
  disabled,
  onMove,
  onDelete,
  onSetCover,
  onCaption,
}: GalleryItemCardProps) {
  const [caption, setCaption] = useState(item.caption ?? '')
  const g = tr.admin.gallery

  return (
    <li
      className={cn(
        'flex flex-col overflow-hidden rounded-xl border bg-card',
        isCover && 'ring-2 ring-brand',
      )}
    >
      <div className="relative aspect-[4/3]">
        <Image
          src={item.url}
          alt={item.caption ?? ''}
          fill
          sizes="(min-width: 640px) 33vw, 50vw"
          className="object-cover"
        />
        {isCover ? <Badge className="absolute top-2 left-2">{g.cover}</Badge> : null}
        <span className="absolute top-2 right-2 rounded bg-background/80 px-1.5 py-0.5 text-xs tabular-nums">
          {index + 1}
        </span>
      </div>
      <div className="space-y-2 p-2">
        <Input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          onBlur={() => {
            if (caption !== (item.caption ?? '')) onCaption(caption)
          }}
          placeholder={g.captionPlaceholder}
          aria-label={g.caption}
          className="h-9 text-sm"
          maxLength={120}
          disabled={disabled}
        />
        <div className="flex items-center justify-between gap-1">
          <div className="flex gap-1">
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={disabled || index === 0}
              onClick={() => onMove(-1)}
              aria-label={g.moveUp}
            >
              <ArrowUpIcon />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              disabled={disabled || index === total - 1}
              onClick={() => onMove(1)}
              aria-label={g.moveDown}
            >
              <ArrowDownIcon />
            </Button>
          </div>
          <div className="flex gap-1">
            {canSetCover ? (
              <Button
                type="button"
                variant={isCover ? 'secondary' : 'outline'}
                size="icon-sm"
                disabled={disabled}
                onClick={() => onSetCover(isCover ? null : item.mediaId)}
                aria-label={isCover ? g.removeCover : g.setCover}
                aria-pressed={isCover}
              >
                <StarIcon className={cn(isCover && 'fill-current')} />
              </Button>
            ) : null}
            <Button
              type="button"
              variant="destructive"
              size="icon-sm"
              disabled={disabled}
              onClick={onDelete}
              aria-label={tr.common.delete}
            >
              <Trash2Icon />
            </Button>
          </div>
        </div>
      </div>
    </li>
  )
}
