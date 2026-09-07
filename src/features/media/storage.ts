import 'server-only'
import { serverEnv } from '@/lib/env.server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'

export interface SignedUpload {
  bucket: string
  path: string
  token: string
  signedUrl: string
}

/** Supabase tek istekte en fazla bu kadar dosya siler; daha uzun listeler parçalanır. */
const REMOVE_BATCH = 100
const LIST_PAGE = 1000

function bucket() {
  return createSupabaseAdminClient().storage.from(serverEnv.SUPABASE_STORAGE_BUCKET)
}

/** Tarayıcının doğrudan Storage'a yükleyeceği imzalı URL. Sunucudan dosya geçmez. */
export async function createSignedUpload(path: string): Promise<SignedUpload> {
  const { data, error } = await bucket().createSignedUploadUrl(path)
  if (error || !data)
    throw new Error(`İmzalı yükleme URL'i alınamadı: ${error?.message ?? 'bilinmeyen'}`)
  return {
    bucket: serverEnv.SUPABASE_STORAGE_BUCKET,
    path: data.path,
    token: data.token,
    signedUrl: data.signedUrl,
  }
}

export async function objectExists(path: string): Promise<boolean> {
  const { data, error } = await bucket().exists(path)
  if (error) return false
  return data
}

/** Dosyaları siler; hata fırlatmaz, loglar (DB kaydı zaten silinmiştir). */
export async function removeObjects(paths: string[]): Promise<void> {
  if (paths.length === 0) return
  const store = bucket()
  for (let i = 0; i < paths.length; i += REMOVE_BATCH) {
    const batch = paths.slice(i, i + REMOVE_BATCH)
    const { error } = await store.remove(batch)
    if (error) console.error('[storage] silme hatası', batch, error.message)
  }
}

export interface StoredObject {
  path: string
  /** Supabase bazı nesneler için tarih döndürmez; o zaman null. */
  createdAt: Date | null
}

/**
 * Bucket'taki tüm dosyaları klasörlere inerek listeler. Yalnızca bakım işleri (yetim temizliği)
 * içindir; site küçük olduğundan tam tarama ucuzdur.
 */
export async function listAllObjects(prefix = ''): Promise<StoredObject[]> {
  const store = bucket()
  const files: StoredObject[] = []
  const folders = [prefix]
  while (folders.length > 0) {
    const folder = folders.pop() as string
    for (let offset = 0; ; offset += LIST_PAGE) {
      const { data, error } = await store.list(folder, {
        limit: LIST_PAGE,
        offset,
        sortBy: { column: 'name', order: 'asc' },
      })
      if (error) throw new Error(`Depolama listelenemedi (${folder || '/'}): ${error.message}`)
      for (const entry of data) {
        // Supabase'in klasör yer tutucusu (.emptyFolderPlaceholder) dosya değildir.
        if (entry.name.startsWith('.')) continue
        const path = folder ? `${folder}/${entry.name}` : entry.name
        if (entry.id === null) folders.push(path)
        else files.push({ path, createdAt: entry.created_at ? new Date(entry.created_at) : null })
      }
      if (data.length < LIST_PAGE) break
    }
  }
  return files
}
