import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import { homedir } from 'node:os'
import { extname, join, resolve } from 'node:path'
import { readdir, readFile } from 'node:fs/promises'
import type { SupabaseClient } from '@supabase/supabase-js'
import sharp from 'sharp'
import { logAudit } from '@/features/audit/log'
import { buildMediaPath, MAX_UPLOAD_BYTES } from '@/features/media/paths'
import type { Prisma } from '@/generated/prisma/client'
import { db } from '@/lib/db'
import { serverEnv } from '@/lib/env.server'
import { createSupabaseAdminClient } from '@/lib/supabase/admin'
import { slugify } from '@/lib/utils/slugify'

/**
 * Dükkanın gerçek fotoğraflarını klasörden kapağa ve galeriye yükler (patronun WhatsApp'tan
 * gönderdiği toplu fotoğraflar için; tek tek yükleme paneldedir).
 *   pnpm media:import --klasor=~/Desktop/BlackGaleri                      → yalnızca raporlar
 *   pnpm media:import --klasor=~/Desktop/BlackGaleri --apply              → yerele yükler
 *   DOTENV_CONFIG_PATH=.env.canli pnpm media:import --klasor=... --apply  → canlıya yükler
 *
 * Klasör düzeni: her alt klasör bir dükkandır, adı dükkanın adı ya da slug'ıyla eşleşir; büyük/küçük
 * harf, boşluk, tire ve Türkçe karakter farkı önemsizdir ("BlackTostCarsı" → "black-tost-carsi").
 * Dosya adı sırası galeri sırasıdır. "kapak" ile başlayan dosya kapak olur ve galeriye girmez; böyle
 * bir dosya yoksa ilk fotoğraf hem kapak hem galerinin ilk karesi olur. Dosya adının başındaki sıra
 * eki ve uzantısı atılır, kalanı görselin alt metni olur ("01-Dış cephe.jpeg" → "Black Tost Çarşı –
 * Dış cephe"): bu metin ekran okuyucuya ve arama motoruna gider, panelde de başlık olarak görünür.
 *
 * Klasör galerinin tamamıdır: dükkanın eski kapağı ve galerisi dosyalarıyla birlikte silinir, yerine
 * klasördekiler yazılır (demo yer tutucuları böyle temizlenir). Fotoğraf uzun kenarı 2048 px'e
 * sığdırılıp WebP'ye çevrilir; yol biçimi panelinkiyle aynıdır (`shop/<id>/<uuid>.webp`), yani
 * panelden silinip değiştirilebilir. Açık site 1 saat önbellekli: değişiklik en geç bir saat içinde,
 * panelden yapılacak ilk düzenlemede ya da yeni deploy'da hemen görünür.
 */
const FOLDER_ARG = '--klasor='
const MAX_EDGE = 2048
const WEBP_QUALITY = 88
const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif'])
/** Bucket sınırı (`MEDIA_BUCKET_OPTIONS`); dokunulmadan geçen dosya da bunu aşamaz. */
const MAX_BYTES = MAX_UPLOAD_BYTES
/** Fotoğraflar uzak depolamaya yüklendikten sonra yazılır; canlıda uzun listeler için geniş süre. */
const TX_OPTIONS = { timeout: 60_000 }
/** Fotoğraf makinesi/telefon adları alt metin olamaz: "IMG_1234", "WhatsApp Image 2026-…". */
const CAMERA_NAME = /^(?:img|dsc|dscn|pxl|photo|whatsapp|screenshot|ekran)\b/i

interface PreparedImage {
  file: string
  path: string
  body: Buffer
  mimeType: 'image/webp'
  sizeBytes: number
  width: number
  height: number
  /** false: kaynak zaten uygun WebP'ydi, dokunulmadan yüklendi. */
  reencoded: boolean
  /** Dosya adından okunan açıklama; boş olabilir. */
  label: string
  alt: string
}

interface ShopPlan {
  folder: string
  shopId: string
  shopName: string
  slug: string
  cover: PreparedImage
  gallery: PreparedImage[]
}

function readFolderArg(args: string[]): string {
  const raw = args.find((arg) => arg.startsWith(FOLDER_ARG))?.slice(FOLDER_ARG.length)
  if (!raw)
    throw new Error(`Klasör verilmedi. Örnek: pnpm media:import ${FOLDER_ARG}~/Desktop/Foto`)
  const expanded = raw.startsWith('~/') ? join(homedir(), raw.slice(2)) : raw
  return resolve(expanded)
}

/** "BlackTostCarsı", "Black Tost Çarşı" ve "black-tost-carsi" aynı anahtara iner. */
function matchKey(value: string): string {
  return slugify(value).replace(/-/g, '')
}

function isCover(file: string): boolean {
  return /^kapak(?=[-_. ]|\.)/i.test(file)
}

/** Dosya adından alt metin: baştaki sıra eki ("01-", "kapak-") ve uzantı atılır. */
function readLabel(file: string): string {
  const stem = file.slice(0, file.length - extname(file).length)
  // macOS dosya adlarını NFD tutar ("ş" = s + çengel); NFC'ye çevrilmezse alt metin bozuk kopyalanır.
  const label = stem
    .replace(/^(?:kapak|\d+)[-_. ]+/i, '')
    .normalize('NFC')
    .trim()
  if (label.length === 0 || CAMERA_NAME.test(label)) return ''
  return label
}

interface EncodedImage {
  body: Buffer
  width: number
  height: number
  /** Dosya olduğu gibi mi geçti, yoksa yeniden mi kodlandı (rapor için). */
  reencoded: boolean
}

/**
 * Fotoğrafı siteye uygun WebP'ye çevirir. Kaynak zaten sınırlar içinde bir WebP ise (Instagram
 * dışa aktarımı gibi) dosyaya dokunulmaz: ikinci bir kodlama kaliteyi düşürür, dosyayı da
 * çoğu zaman büyütür. Onun dışında uzun kenar 2048 px'e sığdırılıp WebP olarak kodlanır.
 */
async function encode(source: Buffer, file: string): Promise<EncodedImage> {
  const meta = await sharp(source).metadata()
  const fits = (meta.width ?? 0) <= MAX_EDGE && (meta.height ?? 0) <= MAX_EDGE
  // orientation > 1: EXIF döndürmesi var, uygulanması gerekir; dokunmadan geçilemez.
  const upright = (meta.orientation ?? 1) === 1
  if (meta.format === 'webp' && fits && upright && source.byteLength <= MAX_BYTES) {
    return {
      body: source,
      width: meta.width as number,
      height: meta.height as number,
      reencoded: false,
    }
  }
  const { data, info } = await sharp(source)
    // Telefon fotoğrafı dik/yatarken EXIF'e yazılır; döndürme uygulanmazsa site yan gösterir.
    .rotate()
    .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: 'inside', withoutEnlargement: true })
    // smartSubsample tabela ve menü yazılarındaki renk kenarlarını korur.
    .webp({ quality: WEBP_QUALITY, effort: 6, smartSubsample: true })
    .toBuffer({ resolveWithObject: true })
  if (info.size > MAX_BYTES) {
    throw new Error(`${file} kodlandıktan sonra da ${MAX_BYTES} bayt sınırını aşıyor`)
  }
  return { body: data, width: info.width, height: info.height, reencoded: true }
}

async function prepareImage(
  folder: string,
  file: string,
  shopId: string,
  shopName: string,
): Promise<PreparedImage> {
  const source = await readFile(join(folder, file))
  const image = await encode(source, file)
  const label = readLabel(file)
  const fallback = isCover(file) ? `${shopName} kapak görseli` : shopName
  return {
    file,
    path: buildMediaPath('shop', shopId, 'image/webp', randomUUID()),
    body: image.body,
    mimeType: 'image/webp',
    sizeBytes: image.body.byteLength,
    width: image.width,
    height: image.height,
    reencoded: image.reencoded,
    label,
    alt: label ? `${shopName} – ${label}` : fallback,
  }
}

async function planShop(root: string, folder: string): Promise<ShopPlan> {
  const key = matchKey(folder)
  const shops = await db.shop.findMany({
    where: { deletedAt: null },
    select: { id: true, slug: true, name: true },
  })
  const shop = shops.find((s) => matchKey(s.slug) === key || matchKey(s.name) === key)
  if (!shop) throw new Error(`"${folder}" klasörünün karşılığı olan dükkan bulunamadı`)

  const dir = join(root, folder)
  const files = (await readdir(dir))
    .filter((file) => !file.startsWith('.') && IMAGE_EXTENSIONS.has(extname(file).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, 'tr', { numeric: true }))
  if (files.length === 0) throw new Error(`"${folder}" klasöründe fotoğraf yok`)

  const prepared: PreparedImage[] = []
  for (const file of files) prepared.push(await prepareImage(dir, file, shop.id, shop.name))

  const marked = prepared.findIndex((image) => isCover(image.file))
  // Kapak işaretlenmemişse ilk fotoğraf hem kapak hem galerinin ilk karesi olur: fotoğraf kaybolmasın.
  const cover = marked === -1 ? (prepared[0] as PreparedImage) : (prepared[marked] as PreparedImage)
  const gallery = marked === -1 ? prepared : prepared.filter((_, i) => i !== marked)
  return { folder, shopId: shop.id, shopName: shop.name, slug: shop.slug, cover, gallery }
}

function describe(plan: ShopPlan): string {
  const kb = (image: PreparedImage) => `${Math.round(image.sizeBytes / 1024)} KB`
  const size = (image: PreparedImage) =>
    `${image.width}×${image.height}, ${kb(image)}${image.reencoded ? '' : ', dokunulmadı'}`
  const lines = [
    `${plan.folder} → ${plan.slug} (${plan.shopName})`,
    `  kapak  ${plan.cover.file} [${size(plan.cover)}] → ${plan.cover.alt}`,
    ...plan.gallery.map(
      (image, i) =>
        `  ${String(i + 1).padStart(2, '0')}     ${image.file} [${size(image)}] → ${image.alt}`,
    ),
  ]
  return lines.join('\n')
}

async function upload(supabase: SupabaseClient, images: PreparedImage[]): Promise<void> {
  const bucket = supabase.storage.from(serverEnv.SUPABASE_STORAGE_BUCKET)
  for (const image of images) {
    const { error } = await bucket.upload(image.path, image.body, {
      contentType: image.mimeType,
      upsert: false,
    })
    if (error) throw new Error(`Depolamaya yüklenemedi (${image.file}): ${error.message}`)
  }
}

async function createMedia(tx: Prisma.TransactionClient, image: PreparedImage): Promise<string> {
  const media = await tx.media.create({
    data: {
      path: image.path,
      mimeType: image.mimeType,
      sizeBytes: image.sizeBytes,
      width: image.width,
      height: image.height,
      alt: image.alt,
    },
    select: { id: true },
  })
  return media.id
}

/** Yazma bittikten SONRA silinecek eski dosya yolları. */
async function writeShop(plan: ShopPlan): Promise<string[]> {
  const prefix = `shop/${plan.shopId}/`
  return db.$transaction(async (tx) => {
    const previousGallery = await tx.galleryImage.findMany({
      where: { shopId: plan.shopId },
      select: { mediaId: true, media: { select: { path: true } } },
    })
    const shop = await tx.shop.findUniqueOrThrow({
      where: { id: plan.shopId },
      select: { coverImageId: true, coverImage: { select: { path: true } } },
    })

    const coverImageId = await createMedia(tx, plan.cover)
    const gallery: { mediaId: string; caption: string | null }[] = []
    for (const image of plan.gallery) {
      gallery.push({ mediaId: await createMedia(tx, image), caption: image.label || null })
    }
    // Kapak yeni satıra bağlandıktan sonra eskisi silinir; sıra tersine dönerse kapak boşalır.
    await tx.shop.update({ where: { id: plan.shopId }, data: { coverImageId } })
    await tx.galleryImage.createMany({
      data: gallery.map((entry, sortOrder) => ({ ...entry, shopId: plan.shopId, sortOrder })),
    })

    // Eski kapak ve galeri: Media silinince galeri satırı ve (kapaksa) bağ da düşer. Yol öneki
    // koşulu, başka bir kayda ait bir görselin yanlışlıkla silinmesini engeller.
    const stale = new Map<string, string>()
    for (const item of previousGallery) stale.set(item.mediaId, item.media.path)
    if (shop.coverImageId && shop.coverImage) stale.set(shop.coverImageId, shop.coverImage.path)
    const removable = [...stale].filter(([, path]) => path.startsWith(prefix))
    if (removable.length > 0) {
      await tx.media.deleteMany({ where: { id: { in: removable.map(([id]) => id) } } })
    }

    await logAudit(tx, {
      staffId: null,
      action: 'gallery.import',
      entityType: 'Shop',
      entityId: plan.shopId,
      summary: `${plan.shopName}: gerçek fotoğraflar yüklendi (kapak + ${plan.gallery.length} galeri)`,
      data: { folder: plan.folder, gallery: plan.gallery.length, replaced: removable.length },
    })
    return removable.map(([, path]) => path)
  }, TX_OPTIONS)
}

async function removeObjects(supabase: SupabaseClient, paths: string[]): Promise<void> {
  if (paths.length === 0) return
  const { error } = await supabase.storage.from(serverEnv.SUPABASE_STORAGE_BUCKET).remove(paths)
  // DB satırı zaten silindi; dosya kalırsa haftalık yetim temizliği alır.
  if (error) console.error('[storage] eski dosyalar silinemedi', paths, error.message)
}

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  const root = readFolderArg(args)
  const apply = args.includes('--apply')

  const folders = (await readdir(root, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory() && !entry.name.startsWith('.'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b, 'tr', { numeric: true }))
  if (folders.length === 0) throw new Error(`${root} içinde dükkan klasörü yok`)

  const plans: ShopPlan[] = []
  for (const folder of folders) plans.push(await planShop(root, folder))
  process.stdout.write(`${plans.map(describe).join('\n\n')}\n\n`)

  if (!apply) {
    const total = plans.reduce((sum, plan) => sum + plan.gallery.length + 1, 0)
    process.stdout.write(`Kuru çalışma: ${total} fotoğraf hazır. Yüklemek için --apply ekleyin.\n`)
    return
  }

  const supabase = createSupabaseAdminClient()
  for (const plan of plans) {
    await upload(supabase, [plan.cover, ...plan.gallery])
    const stale = await writeShop(plan)
    await removeObjects(supabase, stale)
    process.stdout.write(
      `${plan.slug}: kapak + ${plan.gallery.length} galeri yazıldı, ${stale.length} eski görsel silindi\n`,
    )
  }
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await db.$disconnect()
  })
