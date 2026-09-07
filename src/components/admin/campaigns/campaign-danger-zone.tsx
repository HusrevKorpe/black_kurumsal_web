'use client'

import { Trash2Icon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { Button } from '@/components/ui/button'
import { deleteCampaignAction } from '@/features/campaigns/actions'
import { useAction } from '@/lib/actions/use-action'
import { ROUTES } from '@/lib/constants/routes'
import { tr } from '@/lib/i18n/tr'

export function CampaignDangerZone({ campaignId, title }: { campaignId: string; title: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const remove = useAction(deleteCampaignAction, {
    successMessage: tr.admin.campaigns.deleted,
    onSuccess: () => router.push(ROUTES.admin.campaigns),
  })
  const c = tr.admin.campaigns

  return (
    <section className="rounded-xl border border-destructive/40 p-4">
      <h2 className="font-semibold text-destructive">{c.deleteTitle}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{c.deleteText(title)}</p>
      <Button variant="destructive" className="mt-3" onClick={() => setOpen(true)}>
        <Trash2Icon data-icon="inline-start" /> {tr.common.delete}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={c.deleteTitle}
        description={c.deleteText(title)}
        pending={remove.pending}
        onConfirm={() => void remove.run(campaignId)}
      />
    </section>
  )
}
