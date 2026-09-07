import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { GalleryManager } from '@/components/admin/shops/gallery-manager'
import { getShopForAdmin, getShopGalleryForAdmin } from '@/features/shops/admin-queries'
import { setShopCoverAction } from '@/features/shops/actions'
import { requireStaff } from '@/lib/auth/session'
import { tr } from '@/lib/i18n/tr'
import { mediaPublicUrl } from '@/lib/media/url'

export const metadata: Metadata = { title: tr.admin.gallery.title, robots: { index: false } }

export default async function ShopGalleryPage({
  params,
}: PageProps<'/admin/dukkanlar/[id]/galeri'>) {
  const { id } = await params
  const staff = await requireStaff()
  const shop = await getShopForAdmin(staff, id)
  if (!shop) notFound()
  const gallery = await getShopGalleryForAdmin(staff, shop.id)

  const items = gallery.map((g) => ({
    id: g.id,
    mediaId: g.mediaId,
    url: mediaPublicUrl(g.media),
    caption: g.caption,
  }))
  const setCover = setShopCoverAction.bind(null, shop.id)

  return (
    <GalleryManager
      key={items.map((i) => i.id).join(',')}
      owner={{ shopId: shop.id }}
      uploadOwner={{ kind: 'shop', id: shop.id }}
      items={items}
      coverMediaId={shop.coverImageId}
      setCoverAction={setCover}
    />
  )
}
