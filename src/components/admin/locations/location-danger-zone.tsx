'use client'

import { Trash2Icon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { Button } from '@/components/ui/button'
import { deleteLocationAction } from '@/features/locations/actions'
import { useAction } from '@/lib/actions/use-action'
import { ROUTES } from '@/lib/constants/routes'
import { tr } from '@/lib/i18n/tr'

interface LocationDangerZoneProps {
  locationId: string
  locationName: string
  shopCount: number
}

export function LocationDangerZone({
  locationId,
  locationName,
  shopCount,
}: LocationDangerZoneProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const remove = useAction(deleteLocationAction, {
    successMessage: tr.admin.locations.deleted,
    onSuccess: () => router.push(ROUTES.admin.locations),
  })
  const l = tr.admin.locations

  return (
    <section className="rounded-xl border border-destructive/40 p-4">
      <h2 className="font-semibold text-destructive">{l.deleteTitle}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        {shopCount > 0 ? l.hasShops : l.deleteText(locationName)}
      </p>
      <Button
        variant="destructive"
        className="mt-3"
        disabled={shopCount > 0}
        onClick={() => setOpen(true)}
      >
        <Trash2Icon data-icon="inline-start" /> {tr.common.delete}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={l.deleteTitle}
        description={l.deleteText(locationName)}
        pending={remove.pending}
        onConfirm={() => void remove.run(locationId)}
      />
    </section>
  )
}
