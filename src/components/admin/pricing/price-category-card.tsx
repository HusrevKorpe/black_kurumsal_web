'use client'

import {
  ArrowDownIcon,
  ArrowUpIcon,
  PencilIcon,
  PlusIcon,
  StarIcon,
  Trash2Icon,
} from 'lucide-react'
import { useState } from 'react'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  deleteCategoryAction,
  deleteItemAction,
  reorderItemsAction,
} from '@/features/pricing/actions'
import type { PriceCategoryView, PriceItemView } from '@/features/pricing/view'
import type { ActionResult } from '@/lib/actions/result'
import { tr } from '@/lib/i18n/tr'
import { cn } from '@/lib/utils'
import { formatPriceWithUnit } from '@/lib/utils/format'
import { CategoryDialog } from './category-dialog'
import { ItemDialog } from './item-dialog'

interface PriceCategoryCardProps {
  shopId: string
  category: PriceCategoryView
  index: number
  total: number
  defaultUnit: string | null
  disabled: boolean
  onMoveCategory: (direction: -1 | 1) => void
  run: <T>(promise: Promise<ActionResult<T>>, successMessage?: string) => void
  refresh: () => void
}

type Editing = { kind: 'category' } | { kind: 'item'; item: PriceItemView | null } | null
type Deleting = { kind: 'category' } | { kind: 'item'; item: PriceItemView } | null

export function PriceCategoryCard({
  shopId,
  category,
  index,
  total,
  defaultUnit,
  disabled,
  onMoveCategory,
  run,
  refresh,
}: PriceCategoryCardProps) {
  const [editing, setEditing] = useState<Editing>(null)
  const [deleting, setDeleting] = useState<Deleting>(null)
  const p = tr.admin.pricing

  function moveItem(itemIndex: number, direction: -1 | 1) {
    const target = itemIndex + direction
    if (target < 0 || target >= category.items.length) return
    const ids = category.items.map((i) => i.id)
    const [moved] = ids.splice(itemIndex, 1)
    if (!moved) return
    ids.splice(target, 0, moved)
    run(reorderItemsAction(category.id, { ids }))
  }

  return (
    <section className={cn('rounded-xl border bg-card', !category.isActive && 'opacity-70')}>
      <header className="flex items-start justify-between gap-2 border-b p-3">
        <div className="min-w-0">
          <h2 className="flex items-center gap-2 font-semibold">
            <span className="truncate">{category.name}</span>
            {!category.isActive ? <Badge variant="outline">{p.hidden}</Badge> : null}
          </h2>
          {category.description ? (
            <p className="text-xs text-muted-foreground">{category.description}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            disabled={disabled || index === 0}
            onClick={() => onMoveCategory(-1)}
            aria-label={tr.admin.gallery.moveUp}
          >
            <ArrowUpIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={disabled || index === total - 1}
            onClick={() => onMoveCategory(1)}
            aria-label={tr.admin.gallery.moveDown}
          >
            <ArrowDownIcon />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={disabled}
            onClick={() => setEditing({ kind: 'category' })}
            aria-label={p.editCategory}
          >
            <PencilIcon />
          </Button>
          <Button
            variant="destructive"
            size="icon-sm"
            disabled={disabled}
            onClick={() => setDeleting({ kind: 'category' })}
            aria-label={p.deleteCategoryTitle}
          >
            <Trash2Icon />
          </Button>
        </div>
      </header>

      {category.items.length === 0 ? (
        <p className="p-3 text-sm text-muted-foreground">{p.emptyItems}</p>
      ) : (
        <ul className="divide-y">
          {category.items.map((item, itemIndex) => (
            <li
              key={item.id}
              className={cn('flex items-center gap-2 p-3', !item.isAvailable && 'opacity-60')}
            >
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  <span className={cn('truncate', !item.isAvailable && 'line-through')}>
                    {item.name}
                  </span>
                  {item.isFeatured ? (
                    <StarIcon className="size-3.5 shrink-0 fill-current text-brand" />
                  ) : null}
                </p>
                {item.description ? (
                  <p className="truncate text-xs text-muted-foreground">{item.description}</p>
                ) : null}
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums">
                {item.price !== null ? formatPriceWithUnit(item.price, item.unit) : '—'}
              </span>
              <div className="flex shrink-0 gap-1">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={disabled || itemIndex === 0}
                  onClick={() => moveItem(itemIndex, -1)}
                  aria-label={tr.admin.gallery.moveUp}
                >
                  <ArrowUpIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={disabled || itemIndex === category.items.length - 1}
                  onClick={() => moveItem(itemIndex, 1)}
                  aria-label={tr.admin.gallery.moveDown}
                >
                  <ArrowDownIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={disabled}
                  onClick={() => setEditing({ kind: 'item', item })}
                  aria-label={p.editItem}
                >
                  <PencilIcon />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={disabled}
                  onClick={() => setDeleting({ kind: 'item', item })}
                  aria-label={p.deleteItemTitle}
                >
                  <Trash2Icon className="text-destructive" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <footer className="border-t p-3">
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          onClick={() => setEditing({ kind: 'item', item: null })}
        >
          <PlusIcon data-icon="inline-start" /> {p.addItem}
        </Button>
      </footer>

      {editing?.kind === 'category' ? (
        <CategoryDialog
          open
          onOpenChange={(o) => !o && setEditing(null)}
          shopId={shopId}
          category={category}
          onSaved={refresh}
        />
      ) : null}
      {editing?.kind === 'item' ? (
        <ItemDialog
          open
          onOpenChange={(o) => !o && setEditing(null)}
          shopId={shopId}
          categoryId={category.id}
          item={editing.item}
          defaultUnit={defaultUnit}
          onSaved={refresh}
        />
      ) : null}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(o) => !o && setDeleting(null)}
        title={deleting?.kind === 'item' ? p.deleteItemTitle : p.deleteCategoryTitle}
        description={
          deleting?.kind === 'item'
            ? p.deleteItemText(deleting.item.name)
            : p.deleteCategoryText(category.name)
        }
        pending={disabled}
        onConfirm={() => {
          if (!deleting) return
          const target = deleting
          setDeleting(null)
          if (target.kind === 'item') run(deleteItemAction(target.item.id), p.deleted)
          else run(deleteCategoryAction(category.id), p.deleted)
        }}
      />
    </section>
  )
}
