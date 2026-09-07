'use client'

import { RotateCcwIcon, Trash2Icon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { Button } from '@/components/ui/button'
import type { TrashEntry } from '@/features/trash/queries'
import type { ActionResult } from '@/lib/actions/result'
import { useAction } from '@/lib/actions/use-action'
import { tr } from '@/lib/i18n/tr'

interface TrashSectionProps {
  /** Başlık kimliği; bölüm başlığına aria ile bağlanır. */
  id: string
  title: string
  entries: TrashEntry[]
  /** Sunucuda biçimlenmiş silinme tarihleri; kimlik → metin. */
  deletedLabels: Record<string, string>
  restoreAction: (id: string) => Promise<ActionResult<null>>
  purgeAction: (id: string) => Promise<ActionResult<null>>
}

export function TrashSection({
  id,
  title,
  entries,
  deletedLabels,
  restoreAction,
  purgeAction,
}: TrashSectionProps) {
  const router = useRouter()
  const t = tr.admin.trash
  const [pendingPurge, setPendingPurge] = useState<TrashEntry | null>(null)

  const restore = useAction(restoreAction, {
    successMessage: t.restored,
    onSuccess: () => router.refresh(),
  })
  const purge = useAction(purgeAction, {
    successMessage: t.purged,
    onSuccess: () => {
      setPendingPurge(null)
      router.refresh()
    },
  })

  if (entries.length === 0) return null

  return (
    <section aria-labelledby={id} className="space-y-3">
      <h2 id={id} className="font-semibold">
        {title}
      </h2>
      <ul className="divide-y rounded-xl border">
        {entries.map((entry) => (
          <li key={entry.id} className="flex flex-wrap items-center gap-3 p-3">
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{entry.name}</p>
              <p className="text-xs text-muted-foreground">
                /{entry.slug} · {deletedLabels[entry.id]} · {t.contents(entry.gallery, entry.extra)}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={restore.pending}
                onClick={() => void restore.run(entry.id)}
              >
                <RotateCcwIcon data-icon="inline-start" /> {t.restore}
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => setPendingPurge(entry)}
              >
                <Trash2Icon data-icon="inline-start" /> {t.purge}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={pendingPurge !== null}
        onOpenChange={(open) => {
          if (!open) setPendingPurge(null)
        }}
        title={t.purgeTitle}
        description={pendingPurge ? t.purgeText(pendingPurge.name) : ''}
        confirmLabel={t.purge}
        pending={purge.pending}
        onConfirm={() => {
          if (pendingPurge) void purge.run(pendingPurge.id)
        }}
      />
    </section>
  )
}
