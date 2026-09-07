import sharp from 'sharp'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { PrismaClient } from '@/generated/prisma/client'

interface PlaceholderOptions {
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

export interface UploadedMedia {
  id: string
}

/** Görseli Storage'a yükler (üzerine yazar) ve Media kaydını path'e göre upsert eder. */
export async function uploadPlaceholder(
  db: PrismaClient,
  supabase: SupabaseClient,
  bucket: string,
  path: string,
  opts: PlaceholderOptions,
  alt: string,
): Promise<UploadedMedia> {
  const buffer = await renderPlaceholder(opts)
  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: 'image/webp',
    upsert: true,
  })
  if (error) throw new Error(`Storage yükleme hatası (${path}): ${error.message}`)

  const media = await db.media.upsert({
    where: { path },
    create: {
      bucket,
      path,
      mimeType: 'image/webp',
      sizeBytes: buffer.byteLength,
      width: opts.width,
      height: opts.height,
      alt,
    },
    update: { sizeBytes: buffer.byteLength, width: opts.width, height: opts.height, alt },
    select: { id: true },
  })
  return media
}
