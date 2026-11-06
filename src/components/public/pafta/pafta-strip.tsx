import { clsx } from 'clsx'
import type { HoursExceptionEntry, WeeklyHours } from '@/features/hours'
import type { ResolvedContact } from '@/features/shops/contact'
import { tr } from '@/lib/i18n/tr'
import { PaftaActions } from '../contact-buttons'
import { PaftaHourTiles } from './pafta-hour-tiles'
import { PaftaTile } from './pafta-tile'

interface PaftaStripProps {
  /** Veriden sayılan kutu ("40 fiyat kalemi", "7 dükkan"); sıfırsa çıkmaz. */
  count: { value: number; label: string } | null
  week: WeeklyHours
  exceptions: readonly HoursExceptionEntry[]
  contact: ResolvedContact
  whatsappMessage?: string
}

/**
 * Altın bilgi şeridi: solda en çok üç sayı kutusu (yalnız gerçek veriden: sayım, bugünün açılışı
 * ve kapanışı), sağda iletişim düğmeleri. Telefonda kenardan kenara, geniş ekranda çerçeveli kutu.
 * Gösterecek bir şey kalmazsa şerit hiç çıkmaz.
 */
export function PaftaStrip({ count, week, exceptions, contact, whatsappMessage }: PaftaStripProps) {
  const showCount = count !== null && count.value > 0
  const hasTiles = showCount || week.length > 0
  const actions = <PaftaActions contact={contact} whatsappMessage={whatsappMessage} />
  const hasPhoneActions = Boolean(contact.instagramUrl)
  const hasDesktopActions = Boolean(
    contact.phone || contact.whatsapp || contact.mapUrl || contact.instagramUrl,
  )
  if (!hasTiles && !hasDesktopActions) return null

  return (
    <div
      className={clsx(
        // Düğmeler tek satırda kalsın: geniş ekranda düğme sütunu içeriği kadar, kutular kalanı
        // paylaşır; tablette ikisi alt alta, düğmeler yine yan yana.
        'pafta-strip -mx-[18px] mt-9 grid gap-[18px] px-[18px] py-[22px] md:mx-0 md:mt-14 md:p-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center',
        // Telefonda düğmeler alt çubukta; kutu da yoksa şerit telefonda boş kalmasın.
        !hasTiles && !hasPhoneActions && 'hidden md:grid',
      )}
    >
      {hasTiles ? (
        <div className="pafta-tiles" role="group" aria-label={tr.pafta.stats}>
          {showCount ? <PaftaTile value={String(count.value)} label={count.label} /> : null}
          <PaftaHourTiles week={week} exceptions={exceptions} />
        </div>
      ) : (
        <div className="hidden lg:block" />
      )}
      {hasDesktopActions ? <div className="min-w-0 lg:justify-self-end">{actions}</div> : null}
    </div>
  )
}
