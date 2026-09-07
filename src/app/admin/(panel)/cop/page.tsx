import type { Metadata } from 'next'
import { PageHeader } from '@/components/admin/page-header'
import { TrashSection } from '@/components/admin/trash/trash-section'
import {
  purgeLocationAction,
  purgeShopAction,
  restoreLocationAction,
  restoreShopAction,
} from '@/features/trash/actions'
import { getTrashContents, type TrashEntry } from '@/features/trash/queries'
import { requireOwner } from '@/lib/auth/session'
import { tr } from '@/lib/i18n/tr'

export const metadata: Metadata = { title: tr.admin.trash.title, robots: { index: false } }

const dateTime = new Intl.DateTimeFormat('tr-TR', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Europe/Istanbul',
})

/** Tarihler sunucuda biçimlenir: istemci ile sunucu arasında saat dilimi farkı oluşmasın. */
function deletedLabels(entries: TrashEntry[]): Record<string, string> {
  return Object.fromEntries(
    entries.map((entry) => [entry.id, tr.admin.trash.deletedAt(dateTime.format(entry.deletedAt))]),
  )
}

export default async function TrashPage() {
  await requireOwner()
  const { shops, locations } = await getTrashContents()
  const t = tr.admin.trash
  const isEmpty = shops.length === 0 && locations.length === 0

  return (
    <div className="mx-auto w-full max-w-5xl">
      <PageHeader title={t.title} description={t.description} />
      {isEmpty ? (
        <p className="text-sm text-muted-foreground">{t.empty}</p>
      ) : (
        <div className="space-y-8">
          <TrashSection
            id="cop-dukkanlar"
            title={t.shops}
            entries={shops}
            deletedLabels={deletedLabels(shops)}
            restoreAction={restoreShopAction}
            purgeAction={purgeShopAction}
          />
          <TrashSection
            id="cop-mekanlar"
            title={t.locations}
            entries={locations}
            deletedLabels={deletedLabels(locations)}
            restoreAction={restoreLocationAction}
            purgeAction={purgeLocationAction}
          />
        </div>
      )}
    </div>
  )
}
