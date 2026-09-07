'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { ImageUploadButton } from '@/components/admin/image-upload-button'
import type { FinalizedMedia } from '@/features/media/actions'
import type { UploadOwner } from '@/features/media/client/use-image-upload'
import {
  addGalleryImagesAction,
  removeGalleryImageAction,
  reorderGalleryAction,
  updateGalleryCaptionAction,
} from '@/features/media/gallery-actions'
import type { GalleryOwner } from '@/features/media/gallery-schema'
import type { ActionResult } from '@/lib/actions/result'
import { tr } from '@/lib/i18n/tr'
import { GalleryItemCard, type GalleryItemView } from './gallery-item-card'

interface GalleryManagerProps {
  owner: GalleryOwner
  uploadOwner: UploadOwner
  items: GalleryItemView[]
  coverMediaId: string | null
  /** Verilirse yıldız düğmesi çıkar (dükkan/mekan kapak). */
  setCoverAction?: (mediaId: string | null) => Promise<ActionResult<null>>
}

export function GalleryManager({
  owner,
  uploadOwner,
  items,
  coverMediaId,
  setCoverAction,
}: GalleryManagerProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [order, setOrder] = useState(items)
  const [deleting, setDeleting] = useState<GalleryItemView | null>(null)
  const g = tr.admin.gallery

  function refresh() {
    router.refresh()
  }

  function handle<T>(promise: Promise<ActionResult<T>>, successMessage?: string) {
    startTransition(async () => {
      const result = await promise
      if (result.ok) {
        if (successMessage) toast.success(successMessage)
        refresh()
      } else {
        toast.error(result.error)
        setOrder(items)
      }
    })
  }

  function onUploaded(media: FinalizedMedia[]) {
    handle(
      addGalleryImagesAction({ owner, mediaIds: media.map((m) => m.mediaId) }),
      g.added(media.length),
    )
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= order.length) return
    const next = [...order]
    const [moved] = next.splice(index, 1)
    if (!moved) return
    next.splice(target, 0, moved)
    setOrder(next)
    handle(reorderGalleryAction({ owner, ids: next.map((i) => i.id) }))
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{g.hint}</p>
        <ImageUploadButton owner={uploadOwner} multiple onUploaded={onUploaded} />
      </div>

      {order.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          {g.empty}
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {order.map((item, index) => (
            <GalleryItemCard
              key={item.id}
              item={item}
              index={index}
              total={order.length}
              isCover={coverMediaId === item.mediaId}
              canSetCover={Boolean(setCoverAction)}
              disabled={pending}
              onMove={(direction) => move(index, direction)}
              onDelete={() => setDeleting(item)}
              onSetCover={(mediaId) =>
                setCoverAction && handle(setCoverAction(mediaId), g.coverSaved)
              }
              onCaption={(caption) => handle(updateGalleryCaptionAction({ id: item.id, caption }))}
            />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={g.deleteTitle}
        description={g.deleteText}
        pending={pending}
        onConfirm={() => {
          if (!deleting) return
          const id = deleting.id
          setDeleting(null)
          setOrder((prev) => prev.filter((i) => i.id !== id))
          handle(removeGalleryImageAction(id), g.removed)
        }}
      />
    </div>
  )
}
