import type { Media } from '@/generated/prisma/client'

type PlaceholderCheck = Pick<Media, 'alt'> & Partial<Pick<Media, 'uploadedById'>>

/**
 * Demo içerikle gelen kampanya görseli mi? `content:demo` görseli (renk geçişi + "Kampanya" yazısı)
 * panelden değil betikten yüklenir: yükleyeni yoktur ve alt metni kampanyanın başlığıdır. Panelden
 * yüklenen her görselin yükleyeni olur. Kampanyanın görseli zorunlu olduğu için "görselsiz" kart
 * aslında bu yer tutucuyu taşır; kart onun yerine markalı afişi çizer.
 */
export function isPlaceholderCampaignImage(image: PlaceholderCheck, title: string): boolean {
  return image.uploadedById === null && image.alt === title
}
