import { Skeleton } from '@/components/ui/skeleton'
import { tr } from '@/lib/i18n/tr'

/**
 * Sekmeler arası geçişte (Bilgiler ↔ Saatler ↔ Galeri ↔ Fiyatlar) beklenen yer burası.
 * Üstteki layout paylaşıldığı için başlık ve sekme çubuğu ekranda kalır; yalnızca sekme
 * içeriği bu iskeletle değişir.
 */
export default function DetailTabLoading() {
  return (
    <div className="space-y-6" role="status" aria-label={tr.common.loading}>
      <div className="space-y-3 rounded-xl border bg-card p-4">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
    </div>
  )
}
