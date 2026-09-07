'use client'

import { ImagePlusIcon } from 'lucide-react'
import { useRef } from 'react'
import { Button } from '@/components/ui/button'
import type { FinalizedMedia } from '@/features/media/actions'
import { useImageUpload, type UploadOwner } from '@/features/media/client/use-image-upload'
import { ALLOWED_IMAGE_TYPES } from '@/features/media/paths'
import { tr } from '@/lib/i18n/tr'

interface ImageUploadButtonProps {
  owner: UploadOwner
  onUploaded: (media: FinalizedMedia[]) => void | Promise<void>
  multiple?: boolean
  label?: string
  alt?: string | null
  variant?: 'default' | 'outline' | 'secondary'
  size?: 'default' | 'sm' | 'lg'
}

/** Dosya seç → sıkıştır → Storage → Media. Telefonda kamera veya galeri açılır. */
export function ImageUploadButton({
  owner,
  onUploaded,
  multiple = false,
  label = tr.admin.gallery.upload,
  alt = null,
  variant = 'default',
  size = 'default',
}: ImageUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const { uploadFiles, state, reset } = useImageUpload(owner)
  const busy =
    state.phase === 'compressing' || state.phase === 'uploading' || state.phase === 'saving'

  async function onChange(files: FileList | null) {
    if (!files || files.length === 0) return
    const list = Array.from(files).slice(0, multiple ? 20 : 1)
    const uploaded = await uploadFiles(list, alt)
    if (inputRef.current) inputRef.current.value = ''
    if (uploaded.length > 0) await onUploaded(uploaded)
  }

  let statusText: string | null = null
  if (state.phase === 'compressing')
    statusText = tr.admin.gallery.compressing(state.current, state.total)
  if (state.phase === 'uploading')
    statusText = tr.admin.gallery.uploading(state.current, state.total)
  if (state.phase === 'saving') statusText = tr.admin.gallery.saving

  return (
    <div className="inline-flex flex-col gap-1.5">
      {/* Erişilebilir denetim görünür düğmedir; girdi ekran okuyucu için adlandırılır, sekme sırasında yer almaz. */}
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_IMAGE_TYPES.join(',')}
        multiple={multiple}
        aria-label={label}
        tabIndex={-1}
        className="sr-only"
        onChange={(e) => void onChange(e.target.files)}
        disabled={busy}
      />
      <Button
        type="button"
        variant={variant}
        size={size}
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        <ImagePlusIcon data-icon="inline-start" /> {statusText ?? label}
      </Button>
      {state.phase === 'error' && state.error ? (
        <p role="alert" className="text-xs text-destructive">
          {state.error}{' '}
          <button type="button" className="underline" onClick={reset}>
            {tr.common.retry}
          </button>
        </p>
      ) : null}
    </div>
  )
}
