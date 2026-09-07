import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GalleryManager } from '@/components/admin/shops/gallery-manager'
import { getLocationForAdmin, getLocationGalleryForAdmin } from '@/features/locations/admin-queries'
import { setLocationCoverAction } from '@/features/locations/actions'
import { requireOwner } from '@/lib/auth/session'
import { tr } from '@/lib/i18n/tr'
import { mediaPublicUrl } from '@/lib/media/url'

export const metadata: Metadata = { title: tr.admin.gallery.title, robots: { index: false } }

export default async function LocationGalleryPage({
  params,
}: PageProps<'/admin/mekanlar/[id]/galeri'>) {
  const { id } = await params
  await requireOwner()
  const location = await getLocationForAdmin(id)
  if (!location) notFound()
  const gallery = await getLocationGalleryForAdmin(location.id)
  const items = gallery.map((g) => ({
    id: g.id,
    mediaId: g.mediaId,
    url: mediaPublicUrl(g.media),
    caption: g.caption,
  }))

  return (
    <GalleryManager
      key={items.map((i) => i.id).join(',')}
      owner={{ locationId: location.id }}
      uploadOwner={{ kind: 'location', id: location.id }}
      items={items}
      coverMediaId={location.coverImageId}
      setCoverAction={setLocationCoverAction.bind(null, location.id)}
    />
  )
}
