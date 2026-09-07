'use client'

import { useCallback, useState } from 'react'
import { createSupabaseBrowserClient } from '@/lib/supabase/client'
import { finalizeUpload, requestUploadUrl, type FinalizedMedia } from '../actions'
import { isAllowedImageType, type MediaOwnerKind } from '../paths'
import { compressImage, readImageSize } from './compress'

export type UploadPhase = 'idle' | 'compressing' | 'uploading' | 'saving' | 'error'

export interface UploadState {
  phase: UploadPhase
  error: string | null
  /** Çoklu yüklemede: kaçıncı dosya / toplam */
  current: number
  total: number
}

const IDLE: UploadState = { phase: 'idle', error: null, current: 0, total: 0 }

export interface UploadOwner {
  kind: MediaOwnerKind
  id: string
}

async function uploadOne(
  owner: UploadOwner,
  file: File,
  alt: string | null,
): Promise<FinalizedMedia> {
  const compressed = await compressImage(file)
  const mimeType = compressed.type
  if (!isAllowedImageType(mimeType)) throw new Error('Desteklenmeyen görsel türü')
  const { width, height } = await readImageSize(compressed)

  const ticket = await requestUploadUrl({
    ownerKind: owner.kind,
    ownerId: owner.id,
    mimeType,
    sizeBytes: compressed.size,
  })
  if (!ticket.ok) throw new Error(ticket.error)

  const supabase = createSupabaseBrowserClient()
  const { error } = await supabase.storage
    .from(ticket.data.bucket)
    .uploadToSignedUrl(ticket.data.path, ticket.data.token, compressed, {
      contentType: mimeType,
      upsert: false,
    })
  if (error) throw new Error('Dosya yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin.')

  const saved = await finalizeUpload({
    path: ticket.data.path,
    mimeType,
    sizeBytes: compressed.size,
    width,
    height,
    alt,
  })
  if (!saved.ok) throw new Error(saved.error)
  return saved.data
}

/** Sıkıştır → imzalı URL al → Storage'a yükle → Media kaydı oluştur. */
export function useImageUpload(owner: UploadOwner) {
  const [state, setState] = useState<UploadState>(IDLE)

  const uploadFiles = useCallback(
    async (files: File[], alt: string | null = null): Promise<FinalizedMedia[]> => {
      const results: FinalizedMedia[] = []
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i]
        if (!file) continue
        try {
          setState({ phase: 'compressing', error: null, current: i + 1, total: files.length })
          const result = await uploadOne(owner, file, alt)
          results.push(result)
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Yükleme başarısız'
          setState({ phase: 'error', error: message, current: i + 1, total: files.length })
          return results
        }
      }
      setState(IDLE)
      return results
    },
    [owner],
  )

  const reset = useCallback(() => setState(IDLE), [])
  return { uploadFiles, state, reset }
}
