import { EyeIcon, MessageCircleIcon, PhoneIcon, UsersIcon } from 'lucide-react'
import type { EventTotals } from '@/features/analytics/queries'
import { tr } from '@/lib/i18n/tr'

interface StatCardsProps {
  totals: EventTotals
  visitors: number
}

const number = new Intl.NumberFormat('tr-TR')

/** Patronun ilk bakışta göreceği dört sayı: bakılan sayfa, kişi, WhatsApp, telefon. */
export function StatCards({ totals, visitors }: StatCardsProps) {
  const a = tr.admin.analytics
  const cards = [
    { label: a.cards.views, value: totals.PAGE_VIEW, icon: EyeIcon },
    { label: a.cards.visitors, value: visitors, icon: UsersIcon, note: a.visitorsNote },
    { label: a.cards.whatsapp, value: totals.WHATSAPP_CLICK, icon: MessageCircleIcon },
    { label: a.cards.call, value: totals.CALL_CLICK, icon: PhoneIcon },
  ]

  return (
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label={a.title}>
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border bg-card p-4">
          <div className="flex items-center gap-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <card.icon className="size-4" /> {card.label}
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums">{number.format(card.value)}</p>
          {card.note ? <p className="mt-1 text-xs text-muted-foreground">{card.note}</p> : null}
        </div>
      ))}
    </section>
  )
}
