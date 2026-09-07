import { randomUUID } from 'node:crypto'
import { DAYS_OF_WEEK } from '@/features/hours/types'
import { buildMediaPath, type MediaOwnerKind } from '@/features/media/paths'
import type { Prisma } from '@/generated/prisma/client'
import type { DemoCampaign, DemoHours, DemoLocation, DemoShop } from './demo-data'
import { uploadPlaceholder, type ImageUploader, type UploadedImage } from './demo-media'

/**
 * Demo ayrıntılarını yazan ortak parçalar. Akış panelin iki adımlı yüklemesiyle aynıdır: görseller önce
 * depolamaya yüklenir (transaction dışı), sonra tek transaction içinde Media satırları, alanlar, saat, galeri ve
 * fiyat listesi yazılır. Transaction geri alınırsa dosyalar yetim kalır; haftalık yetim temizliği onları siler.
 * Dosya yolları panel ile aynı biçimdedir (`shop/<id>/<uuid>.webp`), böylece panel bu görselleri kendi yüklediği
 * gibi silebilir/değiştirebilir. Seed (her şeyi sıfırlayıp doldurur) ve `pnpm content:demo` (yalnızca boşları
 * doldurur) ikisi de buradaki işlevleri kullanır.
 */
type Tx = Prisma.TransactionClient

const COVER_SIZE = { width: 1600, height: 900 }
const GALLERY_SIZE = { width: 1200, height: 900 }
export const GALLERY_COUNT = 3

function mediaPath(kind: MediaOwnerKind, ownerId: string): string {
  return buildMediaPath(kind, ownerId, 'image/webp', randomUUID())
}

export interface ShopImages {
  cover: UploadedImage
  gallery: UploadedImage[]
}

export async function uploadShopImages(
  upload: ImageUploader,
  shopId: string,
  shop: { name: string; hue: number },
): Promise<ShopImages> {
  const cover = await uploadPlaceholder(
    upload,
    mediaPath('shop', shopId),
    { title: shop.name, hue: shop.hue, ...COVER_SIZE },
    `${shop.name} kapak görseli`,
  )
  const gallery: UploadedImage[] = []
  for (let i = 0; i < GALLERY_COUNT; i += 1) {
    gallery.push(
      await uploadPlaceholder(
        upload,
        mediaPath('shop', shopId),
        {
          title: shop.name,
          subtitle: `Galeri ${i + 1}`,
          hue: (shop.hue + i * 25) % 360,
          ...GALLERY_SIZE,
        },
        `${shop.name} galeri ${i + 1}`,
      ),
    )
  }
  return { cover, gallery }
}

export async function uploadLocationCover(
  upload: ImageUploader,
  locationId: string,
  location: { name: string; hue: number },
): Promise<UploadedImage> {
  return uploadPlaceholder(
    upload,
    mediaPath('location', locationId),
    { title: location.name, subtitle: 'Mekan', hue: location.hue, ...COVER_SIZE },
    `${location.name} kapak görseli`,
  )
}

/** Kampanya görselleri yükleyenin klasörüne gider (`campaign/<personel id>/…`); aktör yoksa `demo`. */
export async function uploadCampaignImage(
  upload: ImageUploader,
  ownerId: string | null,
  campaign: { title: string; hue: number },
): Promise<UploadedImage> {
  return uploadPlaceholder(
    upload,
    mediaPath('campaign', ownerId ?? 'demo'),
    { title: campaign.title, subtitle: 'Kampanya', hue: campaign.hue, ...COVER_SIZE },
    campaign.title,
  )
}

async function createMedia(tx: Tx, image: UploadedImage): Promise<string> {
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

function weekOf(hours: DemoHours) {
  return DAYS_OF_WEEK.map((dayOfWeek) => ({
    dayOfWeek,
    opensAt: hours.opensAt,
    closesAt: hours.closesAt,
    isClosed: false,
  }))
}

/** Dükkanın demo ayrıntılarını yazar: alanlar, kapak, saat (varsa), galeri, fiyat listesi. Dükkan boş olmalıdır. */
export async function writeShopDetails(
  tx: Tx,
  shopId: string,
  demo: DemoShop,
  images: ShopImages,
): Promise<void> {
  const coverImageId = await createMedia(tx, images.cover)
  await tx.shop.update({
    where: { id: shopId },
    data: {
      description: demo.description,
      address: demo.address ?? null,
      phone: demo.phone ?? null,
      whatsapp: demo.whatsapp ?? null,
      instagramUrl: demo.instagramUrl ?? null,
      features: demo.features,
      coverImageId,
    },
  })
  if (demo.hours) {
    await tx.openingHours.createMany({
      data: weekOf(demo.hours).map((day) => ({ ...day, shopId })),
    })
  }
  for (const [sortOrder, image] of images.gallery.entries()) {
    const mediaId = await createMedia(tx, image)
    await tx.galleryImage.create({ data: { mediaId, shopId, sortOrder } })
  }
  for (const [categoryOrder, category] of demo.priceCategories.entries()) {
    await tx.priceCategory.create({
      data: {
        shopId,
        name: category.name,
        description: category.description ?? null,
        sortOrder: categoryOrder,
        items: {
          create: category.items.map((item, itemOrder) => ({
            name: item.name,
            description: item.description ?? null,
            price: item.price,
            unit: item.unit ?? null,
            isFeatured: item.isFeatured ?? false,
            sortOrder: itemOrder,
          })),
        },
      },
    })
  }
}

/** Mekanın demo ayrıntılarını yazar. Bölgelerin (DISTRICT) ayrıntısı yoktur; kapak yalnızca mekanda (VENUE). */
export async function writeLocationDetails(
  tx: Tx,
  locationId: string,
  demo: DemoLocation,
  cover: UploadedImage | null,
): Promise<void> {
  const coverImageId = cover ? await createMedia(tx, cover) : null
  await tx.location.update({
    where: { id: locationId },
    data: {
      description: demo.description ?? null,
      address: demo.address ?? null,
      mapUrl: demo.mapUrl ?? null,
      phone: demo.phone ?? null,
      whatsapp: demo.whatsapp ?? null,
      coverImageId,
    },
  })
  if (demo.hours) {
    await tx.openingHours.createMany({
      data: weekOf(demo.hours).map((day) => ({ ...day, locationId })),
    })
  }
}

export interface CampaignTarget {
  shopId: string | null
  locationId: string | null
}

/** Kampanyanın hedef dükkan/mekan kimliğini slug'dan bulur; hedef veritabanında yoksa hata. */
export async function resolveCampaignTarget(tx: Tx, demo: DemoCampaign): Promise<CampaignTarget> {
  if (demo.scope === 'GLOBAL') return { shopId: null, locationId: null }
  if (demo.scope === 'SHOP') {
    const shop = await tx.shop.findUnique({
      where: { slug: demo.targetSlug },
      select: { id: true },
    })
    if (!shop) throw new Error(`Kampanya hedefi veritabanında yok: ${demo.targetSlug}`)
    return { shopId: shop.id, locationId: null }
  }
  const location = await tx.location.findUnique({
    where: { slug: demo.targetSlug },
    select: { id: true },
  })
  if (!location) throw new Error(`Kampanya hedefi veritabanında yok: ${demo.targetSlug}`)
  return { shopId: null, locationId: location.id }
}

export interface CampaignPlacement extends CampaignTarget {
  createdById: string | null
  sortOrder: number
}

export async function writeCampaign(
  tx: Tx,
  demo: DemoCampaign,
  image: UploadedImage,
  placement: CampaignPlacement,
): Promise<string> {
  const imageId = await createMedia(tx, image)
  const created = await tx.campaign.create({
    data: {
      title: demo.title,
      description: demo.description,
      imageId,
      scope: demo.scope,
      shopId: placement.shopId,
      locationId: placement.locationId,
      ctaLabel: demo.ctaLabel ?? null,
      isActive: true,
      sortOrder: placement.sortOrder,
      createdById: placement.createdById,
    },
    select: { id: true },
  })
  return created.id
}
