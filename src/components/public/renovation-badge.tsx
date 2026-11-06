import { clsx } from 'clsx'
import { tr } from '@/lib/i18n/tr'

/** Kartta açık/kapalı yerine: tadilattaki dükkanın kehribar, hızlı atan etiketi. */
export function RenovationBadge({ className }: { className?: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-medium text-amber-800 dark:text-amber-400',
        className,
      )}
    >
      <span
        className="status-dot size-2 shrink-0 rounded-full bg-current"
        data-pulse="fast"
        aria-hidden
      />
      {tr.renovation.badge}
    </span>
  )
}
