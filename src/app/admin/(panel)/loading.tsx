import { Skeleton } from '@/components/ui/skeleton'
import { tr } from '@/lib/i18n/tr'

/**
 * Panel içi geçişlerde anında görünen iskelet: kabuk (sol menü, üst bar, alt sekmeler) yerinde
 * kalır, yalnızca içerik alanı beklerken bu görünür.
 *
 * Dosyanın varlığı görsellikten fazlası. Panelin tüm sayfaları çerez okuduğu için dinamik ve
 * dinamik route'lar bir loading sınırı yoksa prefetch'ten tamamen atlanıyor; tıklama sunucu
 * render'ı bitene kadar ekranda hiçbir iz bırakmadan donuyordu
 * (`node_modules/next/dist/docs/01-app/02-guides/prefetching.md`). Sınır ayrıca geçişi
 * kesilebilir yapar: yükleme sürerken başka bir menüye basmak artık çalışır.
 *
 * Bu sınır iç içe layout'ları da kapsar (loading.md: "wraps ... nested layout.js files"), yani
 * dükkan listesinden bir dükkana girerken o layout'un sorgusu da burada beklenir.
 */
export default function AdminLoading() {
  return (
    <div className="mx-auto w-full max-w-5xl" role="status">
      {/* Beklerken de sayfanın bir birinci düzey başlığı olmalı: ekran okuyucu geçişi duyurur,
          axe'in page-has-heading-one kuralı da bunu arıyor. */}
      <h1 className="sr-only">{tr.common.loading}</h1>
      <div aria-hidden="true">
        <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 space-y-2.5">
            <Skeleton className="h-7 w-52" />
            <Skeleton className="h-4 w-72 max-w-full" />
          </div>
          <Skeleton className="h-9 w-32 shrink-0" />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  )
}
