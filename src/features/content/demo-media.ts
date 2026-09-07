import type { SupabaseClient } from '@supabase/supabase-js'
import sharp from 'sharp'

/**
 * Demo içerik için yer tutucu görseller: marka renginde, üstünde dükkan adı yazan WebP. Gerçek fotoğraflar
 * panelden yüklenir. Yükleme işlevi dışarıdan verilir (`ImageUploader`): seed ve `pnpm content:demo` Supabase
 * Storage'a yazar, entegrasyon testleri sahte bir yükleyici kullanır.
 */
export interface PlaceholderOptions {
  title: string
  subtitle?: string
  hue: number
  width: number
  height: number
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** Marka renginde, yazılı bir yer tutucu görsel üretir (WebP). */
export async function renderPlaceholder(opts: PlaceholderOptions): Promise<Buffer> {
  const { width, height, hue } = opts
  const titleSize = Math.round(width / 14)
  const subtitleSize = Math.round(width / 30)
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue}, 35%, 10%)"/>
      <stop offset="1" stop-color="hsl(${hue}, 55%, 26%)"/>
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
  <circle cx="${width * 0.82}" cy="${height * 0.25}" r="${height * 0.35}" fill="hsl(${hue}, 70%, 55%)" opacity="0.18"/>
  <circle cx="${width * 0.15}" cy="${height * 0.85}" r="${height * 0.28}" fill="hsl(${(hue + 40) % 360}, 70%, 60%)" opacity="0.12"/>
  <text x="50%" y="${opts.subtitle ? '50%' : '54%'}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="${titleSize}" font-weight="700" fill="#ffffff">${escapeXml(opts.title)}</text>
  ${
    opts.subtitle
      ? `<text x="50%" y="${50 + (subtitleSize / height) * 100 * 1.8}%" text-anchor="middle" font-family="Helvetica, Arial, sans-serif"
        font-size="${subtitleSize}" fill="#ffffff" opacity="0.8">${escapeXml(opts.subtitle)}</text>`
      : ''
  }
</svg>`
  return sharp(Buffer.from(svg)).webp({ quality: 80 }).toBuffer()
}

/** Üretilen görseli depolamaya yazar. Aynı yola ikinci yazma hata olmalıdır (yollar rastgele UUID taşır). */
export type ImageUploader = (path: string, body: Buffer, contentType: string) => Promise<void>

export function createStorageUploader(supabase: SupabaseClient, bucket: string): ImageUploader {
  return async (path, body, contentType) => {
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, body, { contentType, upsert: false })
    if (error) throw new Error(`Depolamaya yüklenemedi (${path}): ${error.message}`)
  }
}

/** Depolamaya yazılmış, henüz Media satırı açılmamış görsel. */
export interface UploadedImage {
  path: string
  mimeType: 'image/webp'
  sizeBytes: number
  width: number
  height: number
  alt: string
}

export async function uploadPlaceholder(
  upload: ImageUploader,
  path: string,
  opts: PlaceholderOptions,
  alt: string,
): Promise<UploadedImage> {
  const body = await renderPlaceholder(opts)
  await upload(path, body, 'image/webp')
  return {
    path,
    mimeType: 'image/webp',
    sizeBytes: body.byteLength,
    width: opts.width,
    height: opts.height,
    alt,
  }
}
