'use client'

import { Trash2Icon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { Button } from '@/components/ui/button'
import { deleteShopAction } from '@/features/shops/actions'
import { useAction } from '@/lib/actions/use-action'
import { ROUTES } from '@/lib/constants/routes'
import { tr } from '@/lib/i18n/tr'

interface ShopDangerZoneProps {
  shopId: string
  shopName: string
}

export function ShopDangerZone({ shopId, shopName }: ShopDangerZoneProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const remove = useAction(deleteShopAction, {
    successMessage: tr.admin.shops.deleted,
    onSuccess: () => router.push(ROUTES.admin.shops),
  })

  return (
    <section className="rounded-xl border border-destructive/40 p-4">
      <h2 className="font-semibold text-destructive">{tr.admin.shops.deleteTitle}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{tr.admin.shops.deleteText(shopName)}</p>
      <Button variant="destructive" className="mt-3" onClick={() => setOpen(true)}>
        <Trash2Icon data-icon="inline-start" /> {tr.common.delete}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={tr.admin.shops.deleteTitle}
        description={tr.admin.shops.deleteText(shopName)}
        pending={remove.pending}
        onConfirm={() => void remove.run(shopId)}
      />
    </section>
  )
}
