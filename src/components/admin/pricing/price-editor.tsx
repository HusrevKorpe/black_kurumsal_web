'use client'

import { PlusIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { reorderCategoriesAction } from '@/features/pricing/actions'
import type { PriceCategoryView } from '@/features/pricing/view'
import type { ActionResult } from '@/lib/actions/result'
import { tr } from '@/lib/i18n/tr'
import { CategoryDialog } from './category-dialog'
import { PriceCategoryCard } from './price-category-card'

interface PriceEditorProps {
  shopId: string
  categories: PriceCategoryView[]
  defaultUnit: string | null
}

export function PriceEditor({ shopId, categories, defaultUnit }: PriceEditorProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [adding, setAdding] = useState(false)
  const p = tr.admin.pricing

  const refresh = () => router.refresh()

  function run<T>(promise: Promise<ActionResult<T>>, successMessage?: string) {
    startTransition(async () => {
      const result = await promise
      if (result.ok) {
        if (successMessage) toast.success(successMessage)
        refresh()
      } else {
        toast.error(result.error)
      }
    })
  }

  function moveCategory(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= categories.length) return
    const ids = categories.map((c) => c.id)
    const [moved] = ids.splice(index, 1)
    if (!moved) return
    ids.splice(target, 0, moved)
    run(reorderCategoriesAction(shopId, { ids }))
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setAdding(true)} disabled={pending}>
          <PlusIcon data-icon="inline-start" /> {p.addCategory}
        </Button>
      </div>

      {categories.length === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
          {p.empty}
        </p>
      ) : (
        <div className="space-y-4">
          {categories.map((category, index) => (
            <PriceCategoryCard
              key={category.id}
              shopId={shopId}
              category={category}
              index={index}
              total={categories.length}
              defaultUnit={defaultUnit}
              disabled={pending}
              onMoveCategory={(direction) => moveCategory(index, direction)}
              run={run}
              refresh={refresh}
            />
          ))}
        </div>
      )}

      {adding ? (
        <CategoryDialog
          open
          onOpenChange={(o) => !o && setAdding(false)}
          shopId={shopId}
          category={null}
          onSaved={refresh}
        />
      ) : null}
    </div>
  )
}
