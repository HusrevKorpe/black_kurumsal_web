import type { ReactNode, SelectHTMLAttributes } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { tr } from '@/lib/i18n/tr'
import { cn } from '@/lib/utils'

interface FieldProps {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  optional?: boolean
  children: ReactNode
  className?: string
}

/** Etiket + giriş + hata/ipucu. Hata varsa aria ile bağlanır. */
export function Field({ label, htmlFor, error, hint, optional, children, className }: FieldProps) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={htmlFor} className="flex items-baseline gap-1.5">
        {label}
        {optional ? (
          <span className="text-xs font-normal text-muted-foreground">({tr.common.optional})</span>
        ) : null}
      </Label>
      {children}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p id={`${htmlFor}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

export function FormError({ error }: { error: string | null }) {
  if (!error) return null
  return (
    <Alert variant="destructive">
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  )
}

interface SubmitButtonProps {
  pending: boolean
  label?: string
  pendingLabel?: string
  className?: string
}

export function SubmitButton({
  pending,
  label = tr.common.save,
  pendingLabel = tr.common.saving,
  className,
}: SubmitButtonProps) {
  return (
    <Button type="submit" size="lg" disabled={pending} className={cn('min-w-32', className)}>
      {pending ? pendingLabel : label}
    </Button>
  )
}

/** Yerel select: telefonda en güvenilir seçim deneyimi. shadcn Input ile aynı görünüm. */
export function NativeSelect({
  className,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 dark:bg-input/30',
        className,
      )}
    >
      {children}
    </select>
  )
}

export const inputClass = 'h-10'
